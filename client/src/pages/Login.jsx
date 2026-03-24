import React from 'react';
import { SignIn } from '@clerk/clerk-react';

const Login = () => {
    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-slate-950 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full flex justify-center">
                <SignIn
                    routing="path"
                    path="/login"
                    signUpUrl="/register"
                    appearance={{
                        elements: {
                            formButtonPrimary: 'bg-primary hover:bg-opacity-90 text-sm uppercase tracking-wider rounded-sm',
                            card: 'shadow-lg rounded-sm border-none',
                            headerTitle: 'font-serif text-2xl text-primary',
                            headerSubtitle: 'text-gray-600',
                            socialButtonsBlockButton: 'rounded-sm border-gray-300',
                            formFieldInput: 'rounded-sm border-gray-300 focus:ring-primary focus:border-primary',
                            footerActionLink: 'text-primary hover:text-secondary font-medium'
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default Login;

