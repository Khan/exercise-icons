import s3;

import std.algorithm;
import std.conv;
import std.exception;
import std.stdio;
import std.stdint;
import std.string;

enum HOST = null; // i.e., use default

synchronized class S3Connection {
    this() {
        static if (SECRETS.ACCESS_KEY == INVALID_ACCESS_KEY) {
            "No secrets.txt -- skipping s3 initialization!".writeln;
        } else {
            S3_initialize("s3", S3_INIT_ALL, HOST);
            getManifest();
        }
    }
    ~this() {
        static if (SECRETS.ACCESS_KEY == INVALID_ACCESS_KEY) {
            "No secrets.txt -- skipping s3 cleanup!".writeln;
        } else {
            S3_deinitialize();
        }
    }

    bool addOrUpdateFile(string file, string nameOnServer) {
        static if (SECRETS.ACCESS_KEY == INVALID_ACCESS_KEY) {
            ("Skipping upload of " ~ file ~ " - no secrets.txt!").writeln;
            return false;
        }
        scope(failure) {
            ("\tCould not upload " ~ file ~ "...").writeln;
        }
        scope(success) {
            ("\t" ~ nameOnServer ~ " is now up to date...").writeln;
        }

        import std.digest.digest : toHexString;
        import std.digest.md : MD5;
        import std.file : read;
        import std.string;

        auto toUpload = file.read;
        MD5 hash;
        hash.start();
        hash.put(cast(ubyte[]) toUpload);

        string md5_hex = hash.finish.toHexString.toLower;

        if (md5_hex == m_manifest.get(nameOnServer, "")) {
            (file ~ " - no change. skipping upload").writeln;
            return false;
        } else {
            m_manifest[nameOnServer] = md5_hex;
            upload(file, nameOnServer);
            return true;
        }
    }

    void deleteFile(string nameOnServer) {
        static if (SECRETS.ACCESS_KEY == INVALID_ACCESS_KEY) {
            ("Skipping deletion of " ~ nameOnServer ~ " - no secrets.txt!").writeln;
            return;
        }
        scope(failure) {
            ("\tCould not remove " ~ nameOnServer ~ "...").writeln;
        }
        scope(success) {
            ("\tDeleted " ~ nameOnServer ~ "...").writeln;
        }

        auto deleteResponseHandler = S3ResponseHandler(
            null,
            &responseCompleteCallback
        );
        S3_delete_object(&bucketContext, nameOnServer.toStringz(), null, &deleteResponseHandler, null);
    }

    void removeFilesNotIn(bool[string] allFiles) {
        foreach(file, tr; m_manifest) {
            if (!(file in allFiles)) {
                deleteFile(file);
                allFiles.remove(file);
            }
        }
    }

    private void upload(string file, string nameOnServer) {
        import core.sys.posix.sys.stat; // There goes Windows.
        ("Uploading " ~ file ~ " as " ~ nameOnServer ~ "...").writeln;

        auto contentLength = std.file.getSize(file);
        auto data = CallbackData(
            false,
            File(file, "r"),
            contentLength
        );

        S3ResponseHandler responseHandler = {
            &responsePropertiesCallback,
            &responseCompleteCallback
        };

        extern(C) int putObjectDataCallback(int bufferSize, char *buffer, void *callbackData) {
            CallbackData *data = cast(CallbackData *) callbackData;

            ulong ret = 0;

            ret = data.infile.rawRead(buffer[0..bufferSize]).length;
            data.contentLength -= ret;
            return cast(int) ret;
        }

        S3PutObjectHandler putObjectHandler = {
                responseHandler,
                &putObjectDataCallback
        };

        S3_put_object(&bucketContext, nameOnServer.toStringz(), contentLength, null, null, &putObjectHandler, &data);
        enforce(data.success, new S3Exception);
    }

    private string[string] m_manifest; // key to md5 sum

    private void getManifest() {
        "Getting manifest from S3...".writeln;

        S3ResponseHandler responseHandler = {
            &responsePropertiesCallback,
            &responseCompleteCallback
        };

        extern(C) S3Status listBucketCallback(
                int isTruncated,
                const char *nextMarker,
                int contentsCount,
                const S3ListBucketContent *contents,
                int commonPrefixesCount,
                const char **commonPrefixes,
                void *callbackData) {

            auto self = cast(shared S3Connection) callbackData;
            for (int i = 0; i < contentsCount; i++) {
                const S3ListBucketContent *content = &(contents[i]);
                self.gotManifestItem(content.key.to!string, content.eTag.to!string);
            }

            return S3Status.S3StatusOK;
        }

        auto listBucketHandler = S3ListBucketHandler(
                responseHandler,
                &listBucketCallback
        );
        auto data = CallbackData(
            false,
            File(),
            0,
            this
        );
        S3_list_bucket(&bucketContext, null, null, null, 0, null, &listBucketHandler, &data);
        enforce(data.success, new S3Exception);
        "\tGot manifest...".writeln;
    }

    private void gotManifestItem(string key, string md5) {
        m_manifest[key] = md5.strip('\"');
    }

    struct CallbackData {
        bool success;
        File infile;
        uint64_t contentLength;
        shared S3Connection connection;
    }
};

S3BucketContext bucketContext = {
    HOST,
    SECRETS.BUCKET,
    S3Protocol.S3ProtocolHTTP,
    S3UriStyle.S3UriStylePath,
    SECRETS.ACCESS_KEY,
    SECRETS.SECRET_KEY
};

extern(C) S3Status responsePropertiesCallback(
        const S3ResponseProperties *properties,
        void *callbackData) {
    return S3Status.S3StatusOK;
}

extern(C) void responseCompleteCallback(
        S3Status status,
        const S3ErrorDetails *error,
        void *callbackData) {
    auto data = callbackData ? cast(S3Connection.CallbackData*) callbackData : null;
    
    if (status != S3Status.S3StatusOK) {
        ("Invalid status: " ~ status.to!string).writeln;
        ("Message: " ~ error.message.to!string).writeln;
        ("Resource: " ~ error.resource.to!string).writeln;
        ("Further Details: " ~ error.furtherDetails.to!string).writeln;

        // Although all of the API calls we use are synchronous, this callback occurs
        // in a thread other than the one making the call. So that the calling thread
        // can manage the exception, we prefer to set success to false rather than
        // throw an exception.
        if (data) {
            data.success = false;
            return;
        } else {
            throw new S3Exception();
        }
    }
    
    if (data) {
        data.success = true;
    }
}

class S3Exception : Throwable {
    this() {
        super("S3 Exception");
    }
};




/// Secrets

enum INVALID_ACCESS_KEY = "__none__";

static if (!__traits(compiles, import("secrets.txt"))) {
    pragma(msg, q"{
WARNING: Cannot access secrets.txt. File uploads are disabled.
To upload to khan-exercises-2, create secrets.txt with lines:
    {
        ACCESS_KEY = "ACCESS_KEY",
        SECRET_KEY = "SECRET_KEY"
    }
and ***compile with 'make'***.
    }");

    enum SECRETS : const(char*) {
        ACCESS_KEY = INVALID_ACCESS_KEY,
        SECRET_KEY = "__none__",
        BUCKET = "ka-exercise-screenshots-2"
    };
} else {
    mixin("enum SECRETS : const(char*) { " ~ import("secrets.txt") ~ "};");
}
