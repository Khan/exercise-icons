#!/usr/bin/rdmd --shebang -J. -L-Llibs3/build/lib -L-ls3 -L-lxml2 -L-lcurl -IDeimos_libs3/D
/**
 * Usage: ./sync.d Math.CC
 *   <or> ./sync.d Math.CC.3
 *   <or> ./sync.d Math.CC.3.MD
 *   <or> ./sync.d Math.CC.3.MD.B
 *   <or> ./sync.d Math.CC.3.MD.B.4
 *
 * Uploading to S3:
 *   If secrets.txt is accurate, files in build will be uploaded to S3.
 *      Files in S3 that are no longer needed will be removed if you are
 *      doing a full sync (i.e., './sync.d Math.CC')
 *   If secrets.txt is missing or not accurate, an upload will not occur.
 *   After updating 'secrets.txt', run 'make', or 'touch ./sync.d'.
 *
 * Dependencies:
 *      dlang,
 *      rdmd (often in a "dlang-tools" package)
 *      curl,
 *      casperjs,
 *      imagemagick
 */

import core.thread;
import std.algorithm;
import std.ascii;
import std.conv;
import std.exception : enforce;
import std.file;
import std.functional;
import std.json;
import std.net.curl;
import std.parallelism;
import std.process;
import std.range;
import std.string;
import std.stdio;
import std.utf;

import jsonify2;
import structures;
import upload;

alias writeToJSON = curry!(std.file.write, "build/problemTypes.json");
alias writeToReport = curry!(std.file.write, "build/report.csv");

int main(string args[]) {
    bool[string] opts = args.pipe!(
        filter!(arg => arg.startsWith("-")),
        map!(opt => opt.chompPrefix("-")),
        map!(opt => opt.chompPrefix("-")),
        args => reduce!((memo, arg) { memo[arg] = true; return memo; })(
            (bool[string]).init, args)
    );
    args = args
        .filter!(arg => !arg.startsWith("-"))
        .array;

    if (args.length != 2 || opts.get("help", false)) {
        "Usage: ./sync.d <opts> Math.CC".writeln;
        "  <or> ./sync.d <opts> Math.CC.3".writeln;
        "  <or> ./sync.d <opts> Math.CC.3.MD".writeln;
        "  <or> ./sync.d <opts> Math.CC.3.MD.B".writeln;
        "  <or> ./sync.d <opts> Math.CC.3.MD.B.4".writeln;
        "".writeln;
        "Opts: --dry-run: Don't actually upload anything to s3.".writeln;
        "      --generate-report: Generates skills.csv giving information about each skill type for Elizabeth".writeln;
        "      --help: Show this message".writeln;
        return 1;
    }
    string prefix = args[1];

    foreach(opt, on; opts) {
        enforce(["help", "dry-run", "generate-report"].countUntil(opt) != -1,
            "Option '" ~ opt ~ "' is not white-listed.");
    }



    /////
    "Getting all tags and exercises...".writeln;

    auto allTags =
        "http://www.khanacademy.org/api/v1/assessment_items/tags"
        .get
        .replace("\\u0000", "") // Not a valid JSON control character
        .parseJSON
        .array
        .map!(t => new Tag(
            t["id"].str,
            t["display_name"].str))
        .array;

    auto tagsById = allTags
        .indexBy!"id";

    auto ccTags =
        allTags.filter!(t => t.name.startsWith(prefix));

    auto allExercises =
        "http://www.khanacademy.org/api/v1/exercises"
        .get
        .replace("\\u0000", "") // Not a valid JSON control character
        .parseJSON
        .array
        .map!(e => new Exercise(
            e["name"].str,
            e["title"].str,
            e["assessment_item_tags"].array
                .map!(t => t.str in tagsById ? tagsById[t.str] : null)
                .filter!(t => t)
                .array,
            e["problem_types"])).array;



    /////
    "Getting assessment items for each tag...".writeln;

    AssessmentItem[string] items;

    auto taskPool30 = new TaskPool(30);
    foreach(tag; taskPool30.parallel(ccTags, 1)) {
        ("\t" ~ tag.name ~ "...").writeln;

        tryForever(() {
            scope(failure) {
                ("Something went wrong when downloading and parsing " ~ tag.name).writeln;
                ("Tried to get http://www.khanacademy.org/api/v1/assessment_items?search=tag:" ~ tag.id).writeln;
            }
            auto assessmentItems = 
                ("http://www.khanacademy.org/api/v1/assessment_items?search=tag:" ~ tag.id)
                .get
                .replace("\\u0000", "")
                .parseJSON
                .array;

            foreach (item; assessmentItems) {
                auto itemData = "live_version" in item.object ? item["live_version"] : item["edit_version"];
                auto id = itemData["id"].str;

                if (!(id in items)) {
                    auto tags = itemData["tags"]
                        .array
                        .map!(t => tagsById[t.str])
                        .array;

                    items[id] = new AssessmentItem(id, tags);
                }
            }
        });

        Thread.sleep( dur!"msecs"(1) );
    }




    /////
    "Sorting assessment items into exercises...".writeln;
    foreach(exercise; allExercises) {
        // Right now, tags are the de facto way of getting problem types.
        // We look at problemTypes because that's the only way assessmentItems
        // are exposed for an exercise.

        // TODO(joshnetterfield): Once we move to Perseus One, assessmentItems will be the
        // way to sort assessment items within exercises into types.

        scope(failure) {
            ("Something went wrong when sorting assessment items from " ~ exercise.to!string).writeln;
        }

        JSONValue problemTypes = exercise.unparsedProblemTypes;
        foreach (type; problemTypes.array) {
            foreach (problem; type["items"].array) {
                if ((problem["id"].str in items)) {
                    exercise.items ~= items[problem["id"].str];
                }
            }
        }
        foreach (tag; exercise.tags) {
            if (ccTags.countUntil(tag) != -1) {
                tag.exercises ~= exercise;
            }
        }
    }



    //////
    if (opts.get("generate-report", false)) {
        "Writting skill type report...".writeln;
        ("CC tag\tSkill Name\tAssociated CC tags\tPreviews\n" ~
            ccTags
                .array // sort needs to know size
                .sort!((tag1, tag2) => tag1.name < tag2.name)
                .map!(delegate (tag) { return tag.exercises
                    .sort!((ex1, ex2) => ex1.title < ex2.title)
                    .uniq!((ex1, ex2) => ex1.title == ex2.title)
                    .map!(delegate (exercise) { return
                        exercise.isKhanExercise ?

                            ([tag.name,
                             exercise.title,
                             exercise.tags
                                .map!(tag => tag.name)
                                .filter!(thisTag => thisTag.startsWith("Math.CC"))
                                .filter!(thisTag => thisTag != tag.name)
                                .join(","),
                             "http://sandcastle.kasandbox.org/media/castles/Khan:master/exercises/" ~ exercise.id.replace(" ", "_") ~ ".html"]).array : 

                            ([tag.name,
                             exercise.title,
                             exercise.items.length ? exercise.items[0].tags
                                 .map!(tag => tag.name)
                                 .filter!(thisTag => thisTag.startsWith("Math.CC"))
                                 .filter!(thisTag => thisTag != tag.name)
                                 .join(",") : ""] ~
                            exercise.items
                                .sort!((pt1, pt2) => pt1.problemTypeId < pt2.problemTypeId)
                                .uniq!((pt1, pt2) => pt1.problemTypeId == pt2.problemTypeId)
                                .map!((pt) =>
                                    "https://www.khanacademy.org/preview/content/items/" ~ pt.id)
                                .array
                            );
                    }).array;
                })
                .join // flatten exercises
                .map!(exercise => "\"" ~ exercise.join("\",\"") ~ "\"")
                .join("\n"))
            .writeToReport;
    }
    /////
    //"Checking for soon-to-be-made exercises...".writeln;

    //foreach(tag; ccTags) {
    //    // Catch assessment items that aren't yet in an exercise.
    //    foreach (item; tag.items) {
    //        bool isInAnExercise = false;
    //        foreach(exercise; tag.exercises) {
    //            if (exercise in item.exercises) {
    //                isInAnExercise = true;
    //                break;
    //            }
    //        }
    //        if (!isInAnExercise) {
    //            string exName = item.exerciseNameGuess;
    //            auto matchesName = delegate(Exercise ex) {
    //                return ex.title == exName;
    //            };
    //            if (!tag.exercises.any!matchesName) {
    //                tag.exercises ~= new Exercise(exName, exName, [tag], JSONValue());
    //            }
    //            tag.exercises.until!matchesName(OpenRight.no).array.back.items ~= item;
    //            tag.items ~= item;
    //        }
    //    }
    //}



    /////
    "Capturing screenshots...".writeln;
    string[] screenshotItems;
    foreach(tag; taskPool30.parallel(ccTags)) {
        foreach(ex; tag.exercises) {
            if (ex.isKhanExercise) {
                screenshotItems ~= ex.id;
            } else {
                screenshotItems ~= ex
                    .items
                    .specimen
                    .ids;
            }
        }
    }

    auto i = screenshotItems.length;

    auto taskPool8 = new TaskPool(8);
    auto s3Future = opts.get("dry-run", false) ? null : task!(() => new shared S3Connection);
    if (s3Future) {
        taskPool8.put(s3Future);
    }
    foreach(item; taskPool8.parallel(screenshotItems)) {
        tryForever(() {
            ("\tCapturing " ~ item ~ "...").writeln;
            scope(success) {
                ("\t\t" ~ (--i).to!string ~ " to go...").writeln;
            }
            auto prototype = "./build/" ~ item ~ ".png";
            if (prototype.exists || ("./build/" ~ item ~ "-0.png").exists) {
                return;
            }
            assert(0 == ["./capture.js", item].execute.status);

            auto entries = dirEntries("./build", item ~ "*png", SpanMode.shallow);
            assert(!entries.empty);
            foreach(file; parallel(entries)) {
                assert(file.exists);

                Thread.sleep( dur!"msecs"(800) );

                assert(0 == ["convert", file, "-resize", "412x412>^", "-background", "white", file]
                    .execute.status);
                Thread.sleep( dur!"msecs"(800) );
                assert(0 == ["convert", file, "-bordercolor", "white", "-trim", "-background", "white", "-extent", "256x256", file]
                    .execute.status);
                Thread.sleep( dur!"msecs"(800) );
                assert(0 == ["convert", file, "-bordercolor", "white", "-trim", "-gravity", "center", "-background", "white", "-extent", "256x256", file]
                    .execute.status);
            }
        });
    }



    /////
    "Writting build/problemTypes.json...".writeln;

    // Serializable (i.e., non-recursive) versions of tag and exercise:
    struct Standard {
        string name;
        Skill[] skills;

        struct Skill {
            string name;
            size_t problemTypes;
            string specimen[];
            bool isKhanExercise;
            bool requiresTagging;
            size_t questions;
            string tagURLs[];
        }
    }

    auto jsonObject = ccTags
        .map!(tag => Standard(
            tag.name,
            tag.exercises
                .uniq
                .map!(exercise =>
                    Standard.Skill(
                        /* name */
                        exercise.title,

                        /* problemTypes */
                        exercise.isKhanExercise ? exercise.keSpecimen.length : exercise.items.problemTypes,

                        /* specimen */
                        exercise.isKhanExercise ? exercise.keSpecimen(3) : exercise.items.specimen.ids,

                        /* isKhanExercise */
                        exercise.isKhanExercise,

                        /* requiresTagging */
                        !exercise.isKhanExercise && !exercise.items.problemTypes,

                        /* questions */
                        exercise.isKhanExercise ? 200 : exercise.items.length,

                        /* tagURLs - only if not tagged */
                        !exercise.isKhanExercise && !exercise.items.problemTypes ? (
                        exercise.items.map!(item =>
                            "https://www.khanacademy.org/devadmin/content/items/" ~ item.id).array
                            ) : []))
                .array))
        .array
        .indexBy!"name"
        .jsonify;

    (&jsonObject).toJSON.writeToJSON();




    /////
    if (!opts.get("dry-run", false)) {
        "Uploading...".writeln;
        shared S3Connection s3 = s3Future.yieldForce();

        bool[string] allFiles;
        foreach (item; parallel(screenshotItems)) {
            tryForever(() {
                auto prototype = "./build/" ~ item ~ ".png";

                auto entries = dirEntries("./build", item ~ "*png", SpanMode.shallow);
                assert(!entries.empty);
                bool didAnything = false;
                foreach(file; entries) {
                    auto serverName = file.array.retro.until("/").array.retro.to!string;
                    allFiles[serverName] = true;
                    didAnything = didAnything || s3.addOrUpdateFile(file.name, serverName);
                }

                if (didAnything) {
                    Thread.sleep( dur!"msecs"(500) );
                }
            });
        }

        if (prefix == "Math.CC") {
            s3.addOrUpdateFile("build/problemTypes.json", "problemTypes.json");
            allFiles["problemTypes.json"] = true;

            s3.removeFilesNotIn(allFiles);
        } else {
            "WARNING: Not updating manifest because prefix was not Math.CC".writeln;
            "Inspect problemTypes.json. If everything looks good, rerun with Math.CC".writeln;
        }
    } else {
        "Not uploading because --dry-run was specified".writeln;
    }



    //////
    "Done!".writeln;
    taskPool30.finish(true);
    taskPool8.finish(true);

    return 0;
}
