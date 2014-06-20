
# Usage

<!-- this was copied from /bin/usage.txt. DON'T MODIFY unless you change that
file too. -->

```sh
Usage: ./bin/capture.js [options]

    -h --help       Show this message

    -a --all        Shoot all exercises
    -k --khan       Shoot only Khan Exercises
    -p --perseus    Shoot only perseus exercists
    -f --file       Shoot only the exercises specified in the following json
                    file. - for stdin

    -i --image      Don't take screenshots, just do the post-processing with
                    imagemagick and then create the manifest file
    -m --manifest   Don't take screenshots, just create the manifest file

    -u --upload     Upload to s3 after processing. Auth is taken from env
                    variables S3_KEY, S3_SECRET and S3_BUCKET
```

# High level overview

1) making icons & and a manifest json file for common core
2) making icons for parent emails &c

## Common Core things

### Icons

One icon per "problem_type" for each exercise. This includes some fanciness for
KhanExercises, because the different problem types are not declared explicitly.

### Manifest JSON file

The file is called `problemTypes.json`, and is also stored in the s3 bucket.
It looks like

```js
[{
    "Math.CC.party": {
        "name": "Math.CC.party",
        "skills": [{
            name: "Human readable name of skill",
            problemTypes: number of problem types,
            specimen: ["xPartyPart", ..?], // length = number of problem types
            isKhanExercise: ??? bool, // if yes, then problems
            requiresTagging: ??? bool, // no klew
            questions: integer, // number of questions that are awesome.
            tagURLs: [???] // also nothing knwles
        }, ...]
    }
}, ...]
```

## Parent emails

1) take the first screenshot for each exercise (already generated from above)
2) make circular, 70x70 versions, both red and blue tinted.

# This is how things go down

## 1 Get tags


## 2 Get exercises

## 3 You do some wierd magic...

Download a representation of all the items with that tag...which may be a ton. aaaand for each ID, whch looks like "xPartyParty",

items[id] = AssessmentItem(id, tags), where tags are the 
[{id: id, name: "Math.CC.party.party"}, ...]

