/**
 * API layer for Supabase integration
 */

const API = {
    async fetchData(supabase) {
        if (!supabase) return { posts: [], categories: [] };

        try {
            // Fetch posts
            const { data: posts, error: postError } = await supabase
                .from('archive_posts')
                .select('*, categories(name)')
                .eq('is_private', false)
                .order('title', { ascending: true });

            if (postError) throw postError;

            // Fetch categories
            const { data: catData } = await supabase
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });

            return { posts, categories: catData || [] };
        } catch (err) {
            console.error('❌ Data Fetch Error:', err);
            throw err;
        }
    },

    async saveItem(supabase, id, data) {
        const { error } = await supabase
            .from('archive_posts')
            .update({
                title: data.title,
                content: data.content,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async deleteItem(supabase, id) {
        const { error } = await supabase
            .from('archive_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async createItem(supabase, data) {
        // Find category ID first
        const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('id')
            .eq('name', data.categoryName)
            .single();

        if (catError) throw catError;

        const { error } = await supabase
            .from('archive_posts')
            .insert([{
                title: data.title,
                content: data.content,
                category_id: catData.id,
                is_private: false,
                origin_free: false
            }]);

        if (error) throw error;
        return true;
    }
};

window.API = API;
