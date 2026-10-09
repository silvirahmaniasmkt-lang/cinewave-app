function movieApp() {
    return {
        // TMDB Credentials & Base Endpoint
        apiKey: 'd45fa2c5eb8605305e413a88609c2650',
        baseUrl: 'https://api.themoviedb.org/3',
        
        // Reactive App State
        movies: [],
        currentPage: 1,        // Halaman API TMDB saat ini
        totalPages: 1,         // Total halaman yang tersedia
        selectedMovie: null,
        trailerKey: null,
        allVideos: [],         // Semua video trailer dari modal
        videoLimit: 6,         // Batas video di dalam modal
        searchQuery: '',
        selectedYear: '',
        minRating: '0',
        sortBy: 'popular',
        sectionTitle: 'Film Populer Hari Ini',
        loading: false,
        loadingMore: false,    // Loading khusus tombol Load More halaman utama
        loadingDetail: false,
        showModal: false,

        init() {
            this.loadPopularMovies();
        },

        // Computed: Fitur Modal (Video Trailer)
        get visibleVideos() {
            return this.allVideos.slice(0, this.videoLimit);
        },

        get hasMoreVideos() {
            return this.allVideos.length > this.videoLimit;
        },

        loadMoreVideos() {
            this.videoLimit += 6;
        },

        // Computed: Filter & Sort di Halaman Utama
        get availableYears() {
            const years = this.movies
                .map(m => m.release_date ? m.release_date.substring(0, 4) : null)
                .filter(y => y !== null);
            return [...new Set(years)].sort((a, b) => b - a);
        },

        get processedMovies() {
            let result = [...this.movies];

            if (this.selectedYear) {
                result = result.filter(m => m.release_date && m.release_date.startsWith(this.selectedYear));
            }

            if (this.minRating !== '0') {
                const min = parseFloat(this.minRating);
                result = result.filter(m => m.vote_average >= min);
            }

            if (this.sortBy === 'rating_desc') {
                result.sort((a, b) => b.vote_average - a.vote_average);
            }

            return result;
        },

        resetFilters() {
            this.selectedYear = '';
            this.minRating = '0';
            this.sortBy = 'popular';
            this.loadPopularMovies();
        },

        // 1. Fetch Film Populer (Halaman Pertama)
        async loadPopularMovies() {
            this.loading = true;
            this.searchQuery = '';
            this.currentPage = 1;
            this.sectionTitle = 'Film Populer Hari Ini';
            
            try {
                const res = await fetch(`${this.baseUrl}/movie/popular?api_key=${this.apiKey}&language=id-ID&page=1`);
                const data = await res.json();
                this.movies = data.results || [];
                this.totalPages = data.total_pages || 1;
            } catch (err) {
                console.error('Gagal mengambil film populer:', err);
            } finally {
                this.loading = false;
            }
        },

        // 2. Fitur "Muat Lebih Banyak Film" di Halaman Utama
        async loadMoreMovies() {
            if (this.currentPage >= this.totalPages) return;
            
            this.loadingMore = true;
            this.currentPage++;

            try {
                let endpoint = '';
                if (this.searchQuery.trim()) {
                    endpoint = `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(this.searchQuery)}&language=id-ID&page=${this.currentPage}`;
                } else {
                    endpoint = `${this.baseUrl}/movie/popular?api_key=${this.apiKey}&language=id-ID&page=${this.currentPage}`;
                }

                const res = await fetch(endpoint);
                const data = await res.json();

                if (data.results) {
                    // Gabungkan film baru ke array film yang sudah ada
                    this.movies = [...this.movies, ...data.results];
                }
            } catch (err) {
                console.error('Gagal memuat film tambahan:', err);
            } finally {
                this.loadingMore = false;
            }
        },

        // 3. Cari Film
        async searchMovies() {
            if (!this.searchQuery.trim()) return;

            this.loading = true;
            this.currentPage = 1;
            this.selectedYear = '';
            this.sectionTitle = `Hasil Pencarian: "${this.searchQuery}"`;

            try {
                const res = await fetch(`${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(this.searchQuery)}&language=id-ID&page=1`);
                const data = await res.json();
                this.movies = data.results || [];
                this.totalPages = data.total_pages || 1;
            } catch (err) {
                console.error('Gagal mencari film:', err);
            } finally {
                this.loading = false;
            }
        },

        // 4. Detail Film & Trailer (Stateless + Fallback Video)
        async openDetail(id) {
            this.showModal = true;
            this.loadingDetail = true;
            this.selectedMovie = null;
            this.trailerKey = null;
            this.allVideos = [];
            this.videoLimit = 6;

            try {
                const detailRes = await fetch(`${this.baseUrl}/movie/${id}?api_key=${this.apiKey}&language=id-ID`);
                this.selectedMovie = await detailRes.json();

                let videoRes = await fetch(`${this.baseUrl}/movie/${id}/videos?api_key=${this.apiKey}&language=id-ID`);
                let videoData = await videoRes.json();

                if (!videoData.results || videoData.results.length === 0) {
                    videoRes = await fetch(`${this.baseUrl}/movie/${id}/videos?api_key=${this.apiKey}&language=en-US`);
                    videoData = await videoRes.json();
                }

                if (videoData.results && videoData.results.length > 0) {
                    this.allVideos = videoData.results.filter(vid => vid.site === 'YouTube');
                    
                    const trailer = this.allVideos.find(vid => vid.type === 'Trailer');
                    if (trailer) {
                        this.trailerKey = trailer.key;
                    } else if (this.allVideos.length > 0) {
                        this.trailerKey = this.allVideos[0].key;
                    }
                }
            } catch (err) {
                console.error('Gagal mengambil detail film:', err);
            } finally {
                this.loadingDetail = false;
            }
        }
    }
}