import React from 'react';

const Loader = ({ fullScreen = false, small = false, text = "Loading..." }) => {
    if (small) {
        return (
            <div className="flex items-center gap-2">
                <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2px solid #f3e8d0', borderTop: '2px solid #b45309',
                    animation: 'iconSpin 0.9s linear infinite'
                }} />
                {text && <span className="text-sm font-medium">{text}</span>}
            </div>
        );
    }

    const loaderContent = (
        <div className="text-center" style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{
                width: 60, height: 60, borderRadius: '50%',
                border: '4px solid #f3e8d0', borderTop: '4px solid #b45309',
                animation: 'iconSpin 0.9s linear infinite', margin: '0 auto 16px'
            }} />
            <p className="text-amber-800 dark:text-amber-500 font-medium tracking-wide">
                {text}
            </p>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="bg-white dark:bg-slate-950 min-h-[60vh] flex items-center justify-center">
                {loaderContent}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-16">
            {loaderContent}
        </div>
    );
};

export default Loader;
