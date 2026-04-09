import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    age: "",
    description: "",
    price: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Cadastro enviado!",
      description: "Seu perfil será analisado e publicado em breve.",
    });
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-lg mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Cadastre-se gratuitamente</CardTitle>
              <CardDescription>
                Crie seu perfil e comece a divulgar seu conteúdo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome artístico</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => update("name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Idade</Label>
                    <Input
                      id="age"
                      type="number"
                      min="18"
                      value={formData.age}
                      onChange={(e) => update("age", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => update("city", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Valor a partir de (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => update("price", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Sobre você</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={4}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  Criar meu perfil
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RegisterPage;
