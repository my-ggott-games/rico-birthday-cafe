import React from "react";
import { PolaroidFrame } from "../components/game/PolaroidFrame";
import { DroppableCharacter } from "../components/game/DroppableCharacter";
import { useNavigate } from "react-router-dom";

const CompareBackgrounds: React.FC = () => {
    const navigate = useNavigate();
    const backgrounds = [
        { id: "bg2", url: "/assets/codygame/background_2.jpg" },
        { id: "bg21", url: "/assets/codygame/background_21.jpg" },
        { id: "bg22", url: "/assets/codygame/background_22.jpg" },
        { id: "bg23", url: "/assets/codygame/background_23.jpg" },
        { id: "bg28", url: "/assets/codygame/background_28.jpg" },
        { id: "bg29", url: "/assets/codygame/background_29.jpg" },
    ];

    // Base IDs for Peasant Dress (촌부)
    const baseHairId = "hair-2";
    const baseClothesId = "clothes-2";
    const baseAccId = "accessories-1";

    const baseAvailableItems = [
        {
            id: baseHairId,
            category: "hair",
            layers: {
                front: "/assets/codygame/rico_hair_front_twintail.png",
                back: "/assets/codygame/riko_hair_back_twintail.png"
            }
        },
        {
            id: baseClothesId,
            category: "clothes",
            layers: {
                main: "/assets/codygame/riko_clothes_peasantdress.png"
            }
        },
        {
            id: baseAccId,
            category: "accessories",
            layers: {
                main: "/assets/codygame/riko_ accessories_flowers.png"
            }
        },
    ];

    return (
        <div className="min-h-screen bg-[#FFFDF7] p-8 overflow-y-auto">
            <div className="mb-8 flex justify-between items-center bg-white/50 p-4 rounded-2xl border border-[#D46A6A]/20">
                <div>
                    <h1 className="text-3xl font-black text-[#4A3b32]">Background Comparison (Peasant Dress)</h1>
                    <p className="text-[#6B7280]">촌부(Peasant Dress) 코디와 배경의 시인성을 확인하기 위한 테스트 페이지입니다.</p>
                </div>
                <button onClick={() => navigate("/game/cody")} className="btn-secondary">
                    ← 게임으로 돌아가기
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 items-start justify-items-center">
                {backgrounds.map((bg) => {
                    // Create unique IDs for THIS instance to avoid Framer Motion layoutId conflicts
                    const uniqueEquippedIds = {
                        hair: `${bg.id}-${baseHairId}`,
                        clothes: `${bg.id}-${baseClothesId}`,
                        hair_acc: null,
                        clothes_acc: null,
                        hand_acc: null,
                        accessories: `${bg.id}-${baseAccId}`,
                    };

                    const uniqueAvailableItems = baseAvailableItems.map(item => ({
                        ...item,
                        id: `${bg.id}-${item.id}`
                    }));

                    return (
                        <div key={bg.id} className="flex flex-col items-center gap-4 w-full">
                            <span className="text-lg font-bold bg-[#4A3b32] text-white px-4 py-1 rounded-full text-center">
                                {bg.url.split('/').pop()}
                            </span>
                            <div className="relative w-full aspect-[3/4] max-w-[400px]">
                                <PolaroidFrame
                                    activeBackground={bg.url}
                                    characterOffset={{ x: 75, y: 80 }}
                                    backgroundContent={
                                        <img
                                            src={bg.url}
                                            className="w-full h-full object-cover"
                                            alt="preview-bg"
                                        />
                                    }
                                >
                                    <div className="relative">
                                        <DroppableCharacter
                                            equippedIds={uniqueEquippedIds as any}
                                            activeId={null}
                                            isFinished={true}
                                            resultImage="/assets/codygame/riko_body_smile.png"
                                            scale={0.55}
                                            isMobile={false}
                                            availableItems={uniqueAvailableItems as any}
                                        />
                                    </div>
                                </PolaroidFrame>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CompareBackgrounds;
