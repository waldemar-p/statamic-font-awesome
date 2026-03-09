export const useFontAwesomeStore = Statamic.$pinia.defineStore('fontAwesome', {
    state: () => ({
        icons: null,
        loading: false,
    }),

    actions: {
        fetchIcons() {
            if (this.icons || this.loading) return Promise.resolve();

            this.loading = true;
            return fetch('/!/font-awesome/icons')
                .then(response => response.json())
                .then(data => {
                    this.icons = Object.values(data);
                })
                .catch(error => {
                    console.error('Failed to fetch Font Awesome icons:', error);
                })
                .finally(() => {
                    this.loading = false;
                });
        },
    },
})
