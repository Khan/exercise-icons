import std.algorithm;
import std.json;
import std.conv;
import std.file;
import std.range;
import std.stdio;
import std.utf;

/**
 * Representation of an assessment item tag.
 *
 * Is a class because of circular dependency with
 * AssessmentItems.tags and Exercise.tags
 */
class Tag {
    string id;
    string name;
    AssessmentItem items[];
    Exercise exercises[];

    this(string id, string name) {
        this.id = id;
        this.name = name;
    }

    override string toString() {
        return name;
    }
};

/**
 * Representation of an assessment item.
 * class because of circular dependency with Tag.items and Exercise.items
 */
class AssessmentItem {
    string id;
    Tag tags[];
    bool[Exercise] exercises;

    this(string id, Tag tags[]) {
        this.id = id;
        this.tags = tags;
        foreach (tag; tags) {
            tag.items ~= this;
        }
    }

    override string toString() {
        return id ~ ":" ~ tags.to!string();
    }
}

/**
 * Representation of an exercise.
 * class because of circular dependency with Tag.exercises and AssessmentItem.exercises
 */
class Exercise {
    string id;
    string title;
    Tag tags[];
    JSONValue unparsedProblemTypes;
    AssessmentItem items[];

    @property bool isKhanExercise() {
        return unparsedProblemTypes.type == JSON_TYPE.ARRAY && !unparsedProblemTypes.array.length;
    }

    this(string id, string title, Tag tags[], JSONValue problemTypes) {
        this.id = id.replace(" ", "_"); // dividing_fractions_word problems_2
        this.title = title;
        this.tags = tags;
        this.unparsedProblemTypes = problemTypes;

        foreach (tag; tags) {
            tag.exercises ~= this;
        }
    }
}

int toIntSafe(T)(T t) {
    try {
        return t.to!int;
    } catch(Throwable e) {
        return 0;
    }
}

/**
 * A best **guess** at the number of problem types in a set of AssessmentItems.
 *
 * Returns '0' if they are not yet tagged.
 */
int problemTypes(AssessmentItem[] items) {
    Tag[] tags;
    foreach(item; items) {
        tags ~= item.tags;
    }

    auto t = tags
        .map!(tag => tag.name.replace("0.5", "05"))
        .filter!(tag => tag.split('.').length == 3);

    return reduce!((int memo, string tag) => max(memo, tag.split('.')[2].toIntSafe()))(0, t);
}

/**
 * A best **guess** at the name of an exercise in a set of AssessmentItems.
 * This assumes that an assessment item isn't part of multiple exercises.
 *
 * Returns '0' if they are not yet tagged.
 */
string exerciseNameGuess(AssessmentItem item) {
    auto t = item.tags
        .map!(tag => tag.name.replace("0.5", "05"))
        .filter!(tag => tag.split('.').length == 3);

    foreach (tag; t) {
        if (tag.split('.')[2].toIntSafe()) {
            return tag.split('.')[1].replace("05", "0.5");
        }
    }
    return "Unknown";
}

/**
 * Returns up to three assessment items of different types.
 */
AssessmentItem[] specimen(AssessmentItem[] items) {
    AssessmentItem[] ret;
    int types = items.problemTypes;
    if (!types) {
        if (items.length) {
            return [items[0]];
        } else {
            return [];
        }
    }

    // Keep track of what problem types we've captured.
    bool[int] cap;

    foreach(item; items) {
        foreach(tag; item.tags) {
            string name = tag.name.replace("0.5", "05");
            if (name.split('.').length != 3) {
                continue;
            }
            int x = name.split('.')[2].toIntSafe();
            if (x in cap) {
                continue;
            }
            cap[x] = true;
            ret ~= item;
            break; // Don't get two captures from the same item
        }
        if (ret.length == 3) {
            // Don't get more than 3 captures per standard.
            break;
        }
    }

    return ret;
}

/**
 * Ditto... for khan-exercise exercises.
 */
string[] keSpecimen(Exercise exercise, int max = 10) {
    return dirEntries("./build", exercise.id ~ "-[0123456789].png", SpanMode.shallow)
        .map!(e => e.to!string.find("-").dropOne.retro.find(".").dropOne.retro)
        .take(max)
        .array;
}

string[] ids(AssessmentItem[] items) {
    return items.map!(item => item.id).array;
}

/**
 * Analogue of _.indexBy
 */
T[string] indexBy(string field, T)(T[] items) {
    T[string] aa;
    foreach(item; items) {
        string key = __traits(getMember, item, field);
        aa[key] = item;
    }
    return aa;
}

/**
 * The web isn't perfect, you know.
 */
void tryUntilItWorksDammit(T)(T fn) {
    try {
        fn();
    } catch(Throwable e) {
        import core.thread;
        "Don't worry, I'm trying again...\n".writeln;
        Thread.sleep( dur!"seconds"(5) );
        fn.tryUntilItWorksDammit();
    }
}

T cCast(T, U)(U u) {
    return cast(T) u;
}

JSONValue parseAsyncJSON(T)(ref T t) {
    return t
        .joiner
        .array
        .cCast!(char[])
        .toUTF8
        .replace("\\u0000", "") // Not a valid JSON control character
        .parseJSON;
}
