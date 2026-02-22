import { APP_LOGO, APP_TITLE } from '@/const';
import { Trash2, Mail, Clock, AlertCircle } from 'lucide-react';

export default function ExclusaoDadosPage() {
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
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-light text-accent mb-2">
                            Exclusão de <span className="font-semibold">Dados</span>
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Solicitação de remoção de dados pessoais
                        </p>
                    </div>

                    {/* Intro */}
                    <p className="text-muted-foreground leading-relaxed mb-8 text-center">
                        Se você utilizou o login social (<span className="font-medium text-accent">Facebook</span> ou{' '}
                        <span className="font-medium text-accent">Google</span>) na Xplore Viagens e deseja
                        excluir seus dados, siga as instruções abaixo.
                    </p>

                    {/* Steps */}
                    <div className="space-y-6 mb-10">
                        {/* Step 1 - Send email */}
                        <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="font-medium text-accent mb-1">Envie um E-mail</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Envie sua solicitação para o endereço abaixo informando o e-mail
                                    utilizado no login:
                                </p>
                                <a
                                    href="mailto:voe@xploreviagens.com.br?subject=Exclus%C3%A3o%20de%20Dados"
                                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm mt-2 transition-colors"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    voe@xploreviagens.com.br
                                </a>
                            </div>
                        </div>

                        {/* Step 2 - Subject */}
                        <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="font-medium text-accent mb-1">Assunto do E-mail</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Utilize o seguinte assunto para facilitar o processamento:
                                </p>
                                <div className="mt-2 inline-block bg-white border border-gray-200 rounded px-3 py-1.5">
                                    <code className="text-sm font-medium text-accent">Exclusão de Dados</code>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 - Timeline */}
                        <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Clock className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h2 className="font-medium text-accent mb-1">Prazo de Remoção</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Após a solicitação, seus dados serão removidos do nosso sistema no prazo de
                                    até <span className="font-medium text-accent">7 dias úteis</span>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center border-t border-gray-100 pt-8">
                        <a
                            href="mailto:voe@xploreviagens.com.br?subject=Exclus%C3%A3o%20de%20Dados"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            Solicitar Exclusão de Dados
                        </a>
                        <p className="text-xs text-muted-foreground mt-4">
                            Ao clicar, seu aplicativo de e-mail será aberto com o assunto preenchido.
                        </p>
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
