#!/bin/sh

# Kick off the exercise icon scraping process
#
# NOTE: before running this you must create a file called 'secrets.sh'
# in this directory, with the following content:
#    S3_KEY=<key>
#    S3_SECRET=<secret>
#    S3_BUCKET=<bucket>

cd $HOME/exercise-icons

. secrets.sh
export S3_KEY S3_SECRET S3_BUCKET

# Prepend  DEBUG=* on the line below for more verbosity
./bin/capture.js -u -a -l 1
