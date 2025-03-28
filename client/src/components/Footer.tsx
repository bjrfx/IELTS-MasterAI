export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-neutral-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              &copy; {currentYear} IELTS Mock Test Platform. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-gray-600 hover:text-primary">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-primary">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-primary">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
