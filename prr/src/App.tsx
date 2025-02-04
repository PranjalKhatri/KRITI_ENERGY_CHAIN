import React from 'react';
import { ArrowRight, Zap, Shield, Leaf, BarChart3, Network, Cpu, LineChart, Lock, Globe2, Power, CheckCircle2 } from 'lucide-react';
import LampDemo from './components/LampDemo';
import  HoverBorderGradientDemo  from './components/HoverBorderGradientDemo';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section with Dynamic Background
      <div className="relative overflow-hidden pb-32">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80')] bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-green-500/10 mix-blend-overlay"></div>
        </div>
        
        <div className="container mx-auto px-4 pt-32 relative text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Zap className="w-20 h-20 text-green-400 animate-pulse" />
              <div className="absolute inset-0 w-20 h-20 bg-green-400 blur-2xl opacity-20"></div>
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Revolutionizing Energy Trading
          </h1>
          <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            A decentralized, secure, and transparent platform for peer-to-peer energy trading and verifiable carbon credit transactions.
          </p>
          <div className="flex justify-center gap-6">
            <a
              href="/platform"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/20"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div> */}

      <LampDemo/>

      {/* Floating Cards Section */}
      <div className="container mx-auto px-4 pt-16  relative">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700/50 transform hover:-translate-y-2 transition-all">
            <Shield className="w-12 h-12 text-blue-400 mb-6" />
            <h3 className="text-xl font-semibold mb-4">ZK-SNARKs Security</h3>
            <p className="text-gray-400">
              Advanced cryptographic privacy while maintaining full transparency in energy transactions.
            </p>
          </div>
          <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700/50 transform hover:-translate-y-2 transition-all">
            <Network className="w-12 h-12 text-green-400 mb-6" />
            <h3 className="text-xl font-semibold mb-4">P2P Trading</h3>
            <p className="text-gray-400">
              Direct energy exchange between producers and consumers without intermediaries.
            </p>
          </div>
          <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700/50 transform hover:-translate-y-2 transition-all">
            <Cpu className="w-12 h-12 text-purple-400 mb-6" />
            <h3 className="text-xl font-semibold mb-4">Smart Grid Integration</h3>
            <p className="text-gray-400">
              IoT-enabled smart meters for real-time energy tracking and automated settlements.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4  pb-24">
        {/* Challenges Section */}
        <div className="max-w-5xl mx-auto mb-32 mt-32">
          <h2 className="text-4xl font-bold mb-16 text-center bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Solving Energy's Biggest Challenges
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <LineChart className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Market Inefficiency</h3>
                  <p className="text-gray-400">Eliminating intermediaries and reducing costs through direct peer-to-peer trading.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <Lock className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Data Privacy</h3>
                  <p className="text-gray-400">ZK-SNARKs technology ensures business data remains confidential while maintaining transparency.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <Globe2 className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Environmental Impact</h3>
                  <p className="text-gray-400">Promoting renewable energy adoption through verifiable carbon credit systems.</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-3xl"></div>
              <div className="relative bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50">
                <h3 className="text-2xl font-semibold mb-6">Platform Highlights</h3>
                <div className="space-y-4">
                  {[
                    "Decentralized P2P Energy Trading",
                    "Privacy-Preserving Transactions",
                    "IoT-Integrated Smart Meters",
                    "Immutable Carbon Credits",
                    "Automated Settlements",
                    "Real-time Analytics"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="max-w-5xl mx-auto mb-32">
          <h2 className="text-4xl font-bold mb-16 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Built with Advanced Technology
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 hover:border-blue-500/50 transition-colors">
              <Power className="w-12 h-12 text-blue-400 mb-6" />
              <h3 className="text-xl font-semibold mb-4">Smart Contracts</h3>
              <p className="text-gray-400">
                Automated and secure energy trading through blockchain-powered smart contracts.
              </p>
            </div>
            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 hover:border-green-500/50 transition-colors">
              <Shield className="w-12 h-12 text-green-400 mb-6" />
              <h3 className="text-xl font-semibold mb-4">ZK-SNARKs</h3>
              <p className="text-gray-400">
                Advanced cryptographic proofs ensuring privacy while maintaining transparency.
              </p>
            </div>
            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 hover:border-purple-500/50 transition-colors">
              <Cpu className="w-12 h-12 text-purple-400 mb-6" />
              <h3 className="text-xl font-semibold mb-4">IoT Integration</h3>
              <p className="text-gray-400">
                Real-time energy monitoring through smart meters and IoT devices.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-slate-800/50 p-12 rounded-3xl border border-slate-700/50">
              <h2 className="text-3xl font-bold mb-6">Join the Future of Energy Trading</h2>
              <p className="text-xl text-gray-300 mb-8">
                Take control of your energy. Trade securely, transparently, and efficiently on our platform.
              </p>
              <a
                href="/platform"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/20"
              >
                Launch Platform
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p>© 2024 Energy Trading Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;