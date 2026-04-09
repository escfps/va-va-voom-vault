import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-primary">Fatal</span>
              <span className="text-2xl font-light">Model</span>
            </div>
            <p className="text-sm opacity-70">
              A maior plataforma de divulgação de conteúdo e modelos do Brasil.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Para Modelos</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link to="/cadastro" className="hover:text-primary transition-colors">Cadastre-se</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Como funciona</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Planos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Para Visitantes</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link to="/busca" className="hover:text-primary transition-colors">Buscar perfis</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Entrar</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Cidades</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link to="/busca?cidade=São Paulo" className="hover:text-primary transition-colors">São Paulo</Link></li>
              <li><Link to="/busca?cidade=Rio de Janeiro" className="hover:text-primary transition-colors">Rio de Janeiro</Link></li>
              <li><Link to="/busca?cidade=Belo Horizonte" className="hover:text-primary transition-colors">Belo Horizonte</Link></li>
              <li><Link to="/busca?cidade=Curitiba" className="hover:text-primary transition-colors">Curitiba</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-10 pt-6 text-center text-sm opacity-50">
          <p>© {new Date().getFullYear()} Fatal Model. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
