
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupBucket() {
    const bucketName = "ea-products";

    console.log(`Checking for bucket '${bucketName}'...`);

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error("Error listing buckets:", listError);
        return;
    }

    const bucketExists = buckets.find((b) => b.name === bucketName);

    if (bucketExists) {
        console.log(`Bucket '${bucketName}' already exists.`);
    } else {
        console.log(`Bucket '${bucketName}' not found. Creating...`);
        const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true, // Set to true if you want public URLs, usually yes for downloads if token not used
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: ["application/x-dosexec", "application/octet-stream"], // .ex4, .ex5 usually octet-stream
        });

        if (createError) {
            console.error("Error creating bucket:", createError);
        } else {
            console.log(`Bucket '${bucketName}' created successfully.`);
        }
    }
}

setupBucket();
