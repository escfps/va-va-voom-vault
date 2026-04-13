import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card text-card-foreground border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-primary">MODEL</span>
              <span className="text-2xl font-light">X</span>
            </div>
            <p className="text-sm opacity-70">
              A maior plataforma de divulgação de conteúdo e modelos.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Para Modelos</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link to="/cadastro" className="hover:text-primary transition-colors">Cadastre-se</Link></li>
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
              <li><Link to="/acompanhantes/sao-paulo-sp" className="hover:text-primary transition-colors">São Paulo</Link></li>
              <li><Link to="/acompanhantes/rio-de-janeiro-rj" className="hover:text-primary transition-colors">Rio de Janeiro</Link></li>
              <li><Link to="/acompanhantes/belo-horizonte-mg" className="hover:text-primary transition-colors">Belo Horizonte</Link></li>
              <li><Link to="/acompanhantes/curitiba-pr" className="hover:text-primary transition-colors">Curitiba</Link></li>
              <li><Link to="/acompanhantes/gramado-rs" className="hover:text-primary transition-colors">Gramado</Link></li>
              <li><Link to="/acompanhantes/porto-alegre-rs" className="hover:text-primary transition-colors">Porto Alegre</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <a
            href="https://instagram.com/xmodelprive"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Instagram className="h-5 w-5" />
            <span>@xmodelprive</span>
          </a>
          <p>© {new Date().getFullYear()} Model X. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
