// ============================================================================
// Supabase Database Type Definitions
// ============================================================================
// Auto-generated types from your Supabase schema. To regenerate:
//   bunx supabase login
//   bunx supabase gen types typescript --project-id [YOUR_PROJECT_REF] \
//     > src/lib/supabase-types.ts
//
// Until you generate from your live Supabase project, this file uses
// a permissive `Database` interface that mirrors our Prisma schema.
// Replace with auto-generated types for type-safe queries.
// ============================================================================

export interface Database {
  public: {
    Tables: {
      // Auth-managed user profiles (mirrors our Prisma User model)
      profiles: {
        Row: {
          id: string
          username: string
          role: 'admin' | 'user'
          display_name: string | null
          theme: 'light' | 'dark'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          role?: 'admin' | 'user'
          display_name?: string | null
          theme?: 'light' | 'dark'
        }
        Update: {
          username?: string
          role?: 'admin' | 'user'
          display_name?: string | null
          theme?: 'light' | 'dark'
        }
      }
      students: {
        Row: {
          id: string
          name: string
          nickname: string | null
          nim: string
          kelas: string
          angkatan: string
          semester: number
          tagline: string | null
          bio: string | null
          instagram: string | null
          asal_daerah: string | null
          image_url: string | null
          owner_id: string | null
          lagu: string | null
          lagu_artis: string | null
          lagu_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['students']['Row']>
        Update: Partial<Database['public']['Tables']['students']['Row']>
      }
      // Add other tables here as you generate from Supabase
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
