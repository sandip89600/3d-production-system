import React, { useState } from 'react';
import { Search, Clock, Calendar, ArrowRight, BookOpen, Rss, Eye } from 'lucide-react';
import Card3DTilt from '../../components/public/Card3DTilt';
export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'ArchViz Tech', 'Case Studies', 'Tutorials', 'Design Trends'];

  const articles = [
    {
      id: 1,
      title: 'The Future of Real-Time ArchViz with Unreal Engine 5',
      category: 'ArchViz Tech',
      date: 'July 10, 2026',
      readTime: '6 min read',
      excerpt: 'How real-time nanite geometry and lumen lighting calculations are eliminating offline rendering times and empowering architects to run interactive customer walk-through sessions.',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      featured: true
    },
    {
      id: 2,
      title: 'Photorealism vs. Artistic Styling in Luxury Renders',
      category: 'Design Trends',
      date: 'June 28, 2026',
      readTime: '4 min read',
      excerpt: 'Analyzing when to prioritize hyper-realistic physical properties over artistic composition, atmospheric fog, and stylized grading to evoke emotional client buy-in.',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
      featured: false
    },
    {
      id: 3,
      title: 'How 3D Walkthroughs Increase Real Estate Pre-sales by 40%',
      category: 'Case Studies',
      date: 'June 15, 2026',
      readTime: '8 min read',
      excerpt: 'A data-backed look at how top developers use early cinematic camera animations to secure client deposits and approvals before concrete foundations are even poured.',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
      featured: false
    },
    {
      id: 4,
      title: 'Mastering Volumetric Lighting: A Corona Renderer Guide',
      category: 'Tutorials',
      date: 'May 30, 2026',
      readTime: '10 min read',
      excerpt: 'Step-by-step instructions on setting up environment media shaders, absorption parameters, and spotlight cones to achieve premium cinematic light shafts in interior scenes.',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
      featured: false
    },
    {
      id: 5,
      title: 'PBR Shaders: Simulating Complex Fabric Reflections',
      category: 'Tutorials',
      date: 'May 12, 2026',
      readTime: '7 min read',
      excerpt: 'A breakdown of velvet, leather, and linen micro-textures using roughness masks, normal maps, and bump variables to elevate close-up furniture visualization accuracy.',
      image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80',
      featured: false
    },
    {
      id: 6,
      title: 'Designing the Noida Creative District: Visualizing Civic Spaces',
      category: 'Case Studies',
      date: 'April 20, 2026',
      readTime: '9 min read',
      excerpt: 'Behind the scenes of rendering Noida’s newest cultural hub. Balancing citizen pathing animations with dynamic daytime lighting sweeps.',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
      featured: false
    }
  ];

  const featuredArticle = articles.find(a => a.featured);
  const regularArticles = articles.filter(a => !a.featured);

  const filterAndSearch = (list) => {
    return list.filter(a => {
      const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            a.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const filteredRegularArticles = filterAndSearch(regularArticles);
  const filteredFeaturedArticle = filterAndSearch([featuredArticle])[0];

  return (
    <div className="pt-28 pb-24 overflow-hidden">
      
      {/* Header section */}
      <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-900 pb-8">
          <div>
            <span className="text-xs uppercase font-bold text-amber-500 tracking-widest block mb-2">Insights & Guides</span>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Studio Blog</h1>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-550 focus:ring-1 focus:ring-amber-550/20 transition-all"
            />
          </div>
        </div>

        {/* Categories list */}
        <div className="flex flex-wrap gap-2 mt-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900 text-slate-400 border border-slate-850 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Article Showcase */}
      {filteredFeaturedArticle && (
        <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-16">
          <div className="bg-[#070b16]/65 border border-slate-900 rounded-3xl overflow-hidden p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-slate-850">
              <img
                src={filteredFeaturedArticle.image}
                alt={filteredFeaturedArticle.title}
                className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
              />
            </div>
            
            <div className="flex flex-col gap-5 justify-center">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  {filteredFeaturedArticle.category}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {filteredFeaturedArticle.date}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {filteredFeaturedArticle.readTime}
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                {filteredFeaturedArticle.title}
              </h2>
              
              <p className="text-slate-400 text-sm leading-relaxed">
                {filteredFeaturedArticle.excerpt}
              </p>

              <button className="inline-flex items-center gap-2 text-amber-500 font-bold hover:text-amber-400 transition-colors w-fit mt-2 group text-sm cursor-pointer">
                <span>Read Full Article</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="px-6 lg:px-12 max-w-7xl mx-auto">
        {filteredRegularArticles.length === 0 && !filteredFeaturedArticle ? (
          <div className="text-center py-20 border border-slate-900 bg-slate-950/20 rounded-2xl">
            <BookOpen className="w-12 h-12 text-slate-650 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300">No Articles Found</h3>
            <p className="text-sm text-slate-500 mt-1">Try refining your search query or switching categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRegularArticles.map(art => (
              <Card3DTilt key={art.id} intensity={8} className="rounded-2xl overflow-hidden h-full">
                <div className="bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden h-full flex flex-col justify-between hover:border-slate-700/60 transition-colors">
                  <div>
                    <div className="aspect-[16/10] w-full overflow-hidden border-b border-slate-850">
                      <img
                        src={art.image}
                        alt={art.title}
                        className="w-full h-full object-cover hover:scale-103 transition-transform duration-500"
                      />
                    </div>
                    
                    <div className="p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-4 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                        <span className="text-amber-500">{art.category}</span>
                        <span>{art.date}</span>
                      </div>
                      
                      <h4 className="text-base font-extrabold text-white leading-snug tracking-wide line-clamp-2">
                        {art.title}
                      </h4>
                      
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                        {art.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-850/40 mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {art.readTime}
                    </span>
                    <button className="text-xs text-amber-500 font-semibold hover:text-amber-400 flex items-center gap-1 group cursor-pointer">
                      <span>Read More</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </Card3DTilt>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
