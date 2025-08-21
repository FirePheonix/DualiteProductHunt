import { Infinity, Twitter, Linkedin, Github, Mail } from 'lucide-react';

const Footer = () => {
    const socialLinks = [
        { icon: Twitter, href: '#' },
        { icon: Linkedin, href: '#' },
        { icon: Github, href: '#' },
        { icon: Mail, href: '#' },
    ];

    const footerLinks = {
        Company: ['About', 'Blog', 'Careers', 'Press'],
        Community: ['Guidelines', 'Help Center', 'Feedback', 'Status'],
        Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'DMCA'],
    };

    return (
        <footer className="bg-brand-gray-dark/30 border-t border-brand-gray-dark backdrop-blur-lg mt-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="space-y-4 pr-8">
                        <a href="#" className="flex items-center space-x-2">
                            <Infinity className="h-8 w-8 text-white" />
                            <span className="text-2xl font-bold">Dualite</span>
                        </a>
                        <p className="text-brand-gray text-sm">
                            Discover, build, and upvote amazing products. Join the community of creators shaping the future of innovation.
                        </p>
                        <div className="flex space-x-3 pt-2">
                            {socialLinks.map((link, index) => (
                                <a key={index} href={link.href} className="bg-brand-gray-dark/50 p-2 rounded-lg text-brand-gray hover:text-white hover:bg-brand-gray-dark transition-all">
                                    <link.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h3 className="font-bold text-white mb-4">{title}</h3>
                            <ul className="space-y-3">
                                {links.map(link => (
                                    <li key={link}>
                                        <a href="#" className="text-brand-gray hover:text-white transition-colors text-sm">{link}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="mt-12 pt-8 border-t border-brand-gray-dark flex flex-col md:flex-row justify-between items-center text-sm text-brand-gray space-y-4 md:space-y-0">
                    <p>© {new Date().getFullYear()} Dualite. All rights reserved.</p>
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-brand-green"></div>
                            <span>All systems operational</span>
                        </div>
                        <span>Made with ❤️ for creators</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
