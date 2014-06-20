
# Exercise Icons

Screenshot khan and perseus exercises and then process the images for use by
the commoncore map and the parent email. Soon to be used in various other
contexts.

# Usage

<!-- this was copied from /bin/usage.txt. DON'T MODIFY unless you change that
file too. -->

```
Usage: ./bin/capture.js [options]

    -h --help        Show this message

    -a --all         Shoot all exercises
    -k --khan        Shoot only Khan Exercises
    -p --perseus     Shoot only perseus exercists
    -f --file [path] Shoot only the exercises specified in the following json
                     file. - for stdin

    -i --image       Don't take screenshots, just do the post-processing with
                     imagemagick and then create the manifest file
    -m --manifest    Don't take screenshots, just create the manifest file

    -u --upload      Upload to s3 after processing. Auth is taken from env
                     variables S3_KEY, S3_SECRET and S3_BUCKET
```

```sh
Examples:

-a -u # shoot all and upload
-k -u # shoot perseus and upload
-i -u # don't shoot, just process and upload
-m -u # don't shoot or process, just create the manifest and upload
```

# High level overview

1. making icons & and a manifest json file for common core
2. making icons for parent emails &c

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

1. take the first screenshot for each exercise (already generated from above)
2. make circular, 70x70 versions, both red and blue tinted. This is done by
compositing the template images in /assets with a shrunk screenshot.

## License
exercise-icons is released under the terms of the MIT license. See COPYING.txt.
