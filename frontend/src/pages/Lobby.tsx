import React from 'react';
import { Link } from 'react-router-dom';

const Lobby: React.FC = () => {
    return (
        <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
            {/* Background Image Placeholder */}
            <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: 'url(/assets/cafe_interior.png)' }}>
                {/* Overlay to dim slightly */}
                <div className="absolute inset-0 bg-black/20"></div>
            </div>

            <div className="relative z-10 w-full h-full">
                {/* Hotspot: TPO Cody (Wardrobe) */}
                <Link to="/game/cody" className="absolute top-1/4 left-1/4 group">
                    <div className="w-32 h-64 bg-white/10 hover:bg-white/30 border-2 border-transparent hover:border-white rounded-lg transition-all flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-bold drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity">Wardrobe</span>
                    </div>
                </Link>

                {/* Hotspot: Itabag (Table) */}
                <Link to="/game/itabag" className="absolute bottom-1/4 right-1/4 group">
                    <div className="w-48 h-32 bg-white/10 hover:bg-white/30 border-2 border-transparent hover:border-white rounded-lg transition-all flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-bold drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity">Itabag Table</span>
                    </div>
                </Link>

                {/* Hotspot: Number Baseball (Poster) */}
                <Link to="/game/baseball" className="absolute top-1/4 right-10 group">
                    <div className="w-24 h-32 bg-white/10 hover:bg-white/30 border-2 border-transparent hover:border-white rounded-lg transition-all flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-bold drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity">Mini Game</span>
                    </div>
                </Link>

                <div className="absolute top-10 left-10 text-white">
                    <h2 className="text-2xl font-bold drop-shadow-lg">Main Lobby</h2>
                    <p className="text-sm opacity-80">Explore the cafe!</p>
                </div>
            </div>
        </div>
    );
};

export default Lobby;
