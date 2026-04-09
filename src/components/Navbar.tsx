import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogIn } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">Fatal</span>
            <span className="text-2xl font-light text-foreground">Model</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/cadastro">
              <Button variant="outline" className="gap-2">
                <User className="h-4 w-4" />
                Cadastre-se grátis
              </Button>
            </Link>
            <Link to="/login">
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <LogIn className="h-4 w-4" />
                Entrar
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link to="/cadastro" className="block">
              <Button variant="outline" className="w-full gap-2">
                <User className="h-4 w-4" />
                Cadastre-se grátis
              </Button>
            </Link>
            <Link to="/login" className="block">
              <Button className="w-full gap-2 bg-primary text-primary-foreground">
                <LogIn className="h-4 w-4" />
                Entrar
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
