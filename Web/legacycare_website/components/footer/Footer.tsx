import React from 'react';

const Footer = () => {
    return (
        <footer className="w-full bg-gray-50 border-t border-gray-200 py-6 mt-8">
            <div className="container mx-auto px-4 text-center">
                <p className="text-sm text-gray-600">
                    © {new Date().getFullYear()} LegacyCare. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;