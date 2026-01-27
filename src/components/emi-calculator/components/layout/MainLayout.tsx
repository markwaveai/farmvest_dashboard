import React from 'react';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-4 lg:p-3 xl:p-8">
            <div className="w-full max-w-full xl:max-w-[1400px] mx-auto">
                <main>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
