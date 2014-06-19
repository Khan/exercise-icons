
# Usage

```sh
./iconify.js
./iconify.js algebra_1 some_other_exercise_name ...

Optins:
    -c just do common core, not the post-processing for emails

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

