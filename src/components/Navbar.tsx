import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X as XIcon, User, LogIn, UserCheck, Heart, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import logoImg from "@/assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImg} alt="X Model Privé" className="h-10" />
            </Link>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <User className="h-4 w-4" />
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer">
                      <LogOut className="h-4 w-4" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="outline" className="gap-2" onClick={() => setShowSignup(true)}>
                    <User className="h-4 w-4" /> Cadastre-se grátis
                  </Button>
                  <Link to="/login">
                    <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      <LogIn className="h-4 w-4" /> Entrar
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <XIcon className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {isOpen && (
            <div className="md:hidden pb-4 space-y-2">
              {user ? (
                <>
                  <p className="text-sm text-muted-foreground px-2">
                    Olá, {user.user_metadata?.full_name || user.email?.split("@")[0]}
                  </p>
                  <Button variant="outline" className="w-full gap-2" onClick={() => { setIsOpen(false); handleSignOut(); }}>
                    <LogOut className="h-4 w-4" /> Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full gap-2" onClick={() => { setIsOpen(false); setShowSignup(true); }}>
                    <User className="h-4 w-4" /> Cadastre-se grátis
                  </Button>
                  <Link to="/login" className="block" onClick={() => setIsOpen(false)}>
                    <Button className="w-full gap-2 bg-primary text-primary-foreground">
                      <LogIn className="h-4 w-4" /> Entrar
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl text-primary">Cadastre-se Grátis</DialogTitle>
            <DialogDescription>Escolha a melhor opção para você</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <Link
              to="/cadastro-usuario"
              onClick={() => setShowSignup(false)}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted transition-all group"
            >
              <div className="p-2.5 rounded-full bg-secondary">
                <UserCheck className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Quero ser cliente</p>
                <p className="text-sm text-muted-foreground">
                  Encontre as melhores acompanhantes disponíveis para você.
                </p>
              </div>
              <span className="text-muted-foreground group-hover:text-primary transition-colors text-xl">›</span>
            </Link>

            <Link
              to="/cadastro?tipo=acompanhante"
              onClick={() => setShowSignup(false)}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted transition-all group"
            >
              <div className="p-2.5 rounded-full bg-primary/10">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-primary">Sou acompanhante</p>
                <p className="text-sm text-muted-foreground">
                  Divulgue seus serviços para milhares de clientes.
                </p>
              </div>
              <span className="text-muted-foreground group-hover:text-primary transition-colors text-xl">›</span>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
