import { APP_LOGO, APP_TITLE } from '@/const';
import { Shield, Mail, UserCircle, Trash2 } from 'lucide-react';

export default function PrivacidadePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20" style={{ background: '#1A2B4C' }}>
            <div className="max-w-2xl w-full">
                {/* Logo */}
                {APP_LOGO && (
                    <div className="text-center mb-12">
                        <img src={APP_LOGO} alt={APP_TITLE} className="h-24 md:h-32 mx-auto" />
                    </div>
                )}

                <div className="bg-white rounded-lg p-8 md:p-12 border-2 border-muted/40" style={{ boxShadow: '0 0 0 6px #fff' }}>
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Shield className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-light text-accent mb-2">
                            Política de <span className="font-semibold">Privacidade</span>
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Última atualização: fevereiro de 2026
                        </p>
                    </div>

                    {/* Intro */}
                    <p className="text-muted-foreground leading-relaxed mb-8 text-center">
                        A <span className="font-medium text-accent">Xplore Viagens</span> valoriza a sua privacidade.
                        Ao utilizar o Login do Facebook ou Google em nosso portal, coletamos apenas as informações
                        necessárias para oferecer a melhor experiência.
                    </p>

                    {/* Items */}
                    <div className="space-y-6 mb-10">
                        {/* Nome e Foto */}
                        <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <UserCircle className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="font-medium text-accent mb-1">Nome e Foto do Perfil</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Utilizamos seu nome e foto para personalizar sua experiência no nosso portal,
                                    como exibir sua avaliação com sua identidade.
                                </p>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Mail className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h2 className="font-medium text-accent mb-1">Endereço de E-mail</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Seu e-mail é coletado para identificação da sua conta e envio de
                                    confirmações de reservas.
                                </p>
                            </div>
                        </div>

                        {/* Segurança */}
                        <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Shield className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="font-medium text-accent mb-1">Segurança dos Dados</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Não compartilhamos seus dados com terceiros. Suas informações são armazenadas
                                    de forma segura e utilizadas exclusivamente para os fins descritos acima.
                                </p>
                            </div>
                        </div>

                        {/* Exclusão */}
                        <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h2 className="font-medium text-accent mb-1">Exclusão de Dados</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Você pode solicitar a exclusão dos seus dados a qualquer momento entrando
                                    em contato conosco.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="text-center border-t border-gray-100 pt-8">
                        <p className="text-sm text-muted-foreground mb-2">
                            Entre em contato para dúvidas ou solicitações:
                        </p>
                        <a
                            href="mailto:voe@xploreviagens.com.br"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            voe@xploreviagens.com.br
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-white/40 text-xs mt-8">
                    © {new Date().getFullYear()} Xplore Viagens. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
