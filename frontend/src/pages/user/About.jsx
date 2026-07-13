import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Trophy, Users, CheckCircle, Calendar, MessageSquare } from 'lucide-react';
import Card3DTilt from '../../components/public/Card3DTilt';

export default function About() {
  const milestones = [
    { year: '2018', title: 'Studio Founded', desc: 'All 3D Studio opened its doors in Noida with a core team of three CAD artists and one workstation.' },
    { year: '2020', title: 'Luxury Real Estate Expansion', desc: 'Partnered with prominent Indian and Middle Eastern real estate developers to deliver large-scale project simulations.' },
    { year: '2022', title: 'Raytracing Cluster Integration', desc: 'Built a dedicated server farm to enable hyper-fast volumetric calculations and Unreal Engine 5 production pipelines.' },
    { year: '2024', title: 'Global Visual Award Winner', desc: 'Received the prestigious "Best Architectural Animation" award from CGArchitect and completed 400+ projects worldwide.' },
    { year: '2026', title: 'Work Management Launch', desc: 'Engineered an in-house client review and artist workflow portal, maximizing collaboration speed.' }
  ];

  const team = [
    {
      name: 'Vikram Aditya',
      role: 'Founder & Design Principal',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
      bio: 'Over 12 years of experience leading architectural visualization projects worldwide.'
    },
    {
      name: 'Meera Sen',
      role: 'Lead Interior Visualizer',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      bio: 'Specialist in luxury lighting, retail boutiques, and high-fidelity indoor texturing.'
    },
    {
      name: 'Rohan Malhotra',
      role: 'Senior CG Animator',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
      bio: 'Master of drone tracking, cinematic lighting, and custom particle scripts.'
    },
    {
      name: 'Sarah D\'Souza',
      role: 'Client Relations & Art Director',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
      bio: 'Bridging client design briefs with rendering topologies to guarantee perfect asset output.'
    }
  ];

  const coreValues = [
    { icon: Sparkles, title: 'Uncompromising Realism', desc: 'We calibrate every material reflection, dust particle, and atmospheric glare to match reality.' },
    { icon: Shield, title: 'CAD and Scale Integrity', desc: 'We maintain millimeter accuracy from drawing to render. Blueprints are treated as absolute law.' },
    { icon: Trophy, title: 'World-Class Quality', desc: 'Our renders match the styling standards of top global visualization firms.' },
    { icon: Users, title: 'Client Transparency', desc: 'Continuous review gates ensure revisions are handled in real-time, meeting delivery milestones.' }
  ];

  return (
    <div className="pt-28 pb-24 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-20">
        <div className="text-center max-w-3xl mx-auto flex flex-col gap-6">
          <span className="text-xs uppercase font-bold text-amber-500 tracking-widest bg-amber-500/10 px-3 py-1 rounded-full w-fit mx-auto border border-amber-500/20">
            About All 3D Studio
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Crafting Digital Realms with <br />
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Precision & Cinema Artistry
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            We are an elite collective of 3D visualizers, animators, and tech enthusiasts headquartered in Noida, Uttar Pradesh, serving real estate giants and design visionaries worldwide.
          </p>
        </div>
      </section>

      {/* 2. PHOTO ROW AND STORY */}
      <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Decorative Grid */}
        <div className="relative grid grid-cols-2 gap-4">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent blur-[50px] pointer-events-none" />
          <div className="rounded-2xl overflow-hidden border border-slate-800 aspect-square">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80"
              alt="Architecture project"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-800 aspect-square translate-y-6">
            <img
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&q=80"
              alt="Interior lounge"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-800 aspect-square -translate-y-6">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80"
              alt="Building detail"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-800 aspect-square">
            <img
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80"
              alt="Rendering material"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>

        {/* Narrative story */}
        <div className="flex flex-col gap-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">Our Story & Core Philosophy</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            At All 3D Studio, we believe that 3D rendering is not just a stage in the pipeline; it is the ultimate showcase of a project’s character. We began in 2018 with a vision to redefine the photorealism bar in commercial real estate marketing.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Through the adoption of physically based rendering models (PBR), raytracing hardware, and dynamic camera tracking, we ensure that every brick, shadow, and reflection behaves exactly as it would in nature. Our clients include interior design firms building high-end retail spaces, boutique hotels needing walkthrough sequences, and real estate groups pre-selling skyscraper units.
          </p>
          
          <div className="flex flex-col gap-3.5 mt-2 text-slate-350">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="text-sm font-medium">Millimeter accurate CAD translations</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="text-sm font-medium">Physically accurate materials and illumination models</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="text-sm font-medium">Fully customizable cameras and flythrough setups</span>
            </div>
          </div>
        </div>

      </section>

      {/* 3. CORE VALUES GRID */}
      <section className="py-20 px-6 lg:px-12 bg-[#060b16]/40 border-y border-slate-900 mb-28 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white">Our Foundational Values</h2>
            <p className="text-slate-400 text-sm">
              We focus on high-fidelity execution, ensuring that our work acts as a true sales accelerator.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreValues.map((v, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <v.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white tracking-wide">{v.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HISTORY / TIMELINE */}
      <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-28">
        <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-4">
          <h2 className="text-3xl font-bold tracking-tight text-white">Milestones & History</h2>
          <p className="text-slate-400 text-sm">Our journey from a single workstation to a global rendering studio.</p>
        </div>

        <div className="relative border-l border-slate-800 max-w-3xl mx-auto pl-8 flex flex-col gap-12">
          {milestones.map((m, idx) => (
            <div key={idx} className="relative">
              {/* Timeline marker */}
              <div className="absolute -left-12 top-1 w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">{m.year}</span>
                <h4 className="text-lg font-bold text-white">{m.title}</h4>
                <p className="text-sm text-slate-450 leading-relaxed max-w-2xl">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TEAM GALLERY SECTION */}
      <section className="px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
          <h2 className="text-3xl font-bold tracking-tight text-white">Meet the Visionaries</h2>
          <p className="text-slate-400 text-sm">
            The skilled texture modelers, architectural specialists, and lighting engineers who craft our photorealistic works.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, idx) => (
            <Card3DTilt key={idx} intensity={8} className="rounded-2xl overflow-hidden shadow-lg border border-slate-850">
              <div className="bg-slate-900 flex flex-col h-full">
                <div className="aspect-[3/4] w-full overflow-hidden relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                </div>
                <div className="p-5 flex-grow flex flex-col gap-2 bg-slate-900 border-t border-slate-850">
                  <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                    {member.role}
                  </span>
                  <h4 className="text-base font-bold text-white tracking-tight">{member.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{member.bio}</p>
                </div>
              </div>
            </Card3DTilt>
          ))}
        </div>
      </section>

    </div>
  );
}
