
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import path from "path"

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../.env.development') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.development")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
    console.log("Seeding dummy resource...")

    // Dummy UUID we used in frontend/backend
    const DUMMY_ID = "00000000-0000-0000-0000-000000000001"

    const { data, error } = await supabase
        .from('resources')
        .upsert({
            id: DUMMY_ID,
            name: "Dr. Default (Template)",
            is_active: true,
            category: "dentist",
            metadata: { specialty: "General" }
        }, { onConflict: 'id' } as any) // Type casting due to strict TS

    if (error) {
        console.error("Error seeding resource:", error)
    } else {
        console.log("Success! Resource created/updated:", DUMMY_ID)
    }
}

seed()
