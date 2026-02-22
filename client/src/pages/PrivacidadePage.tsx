import { APP_LOGO, APP_TITLE } from '@/const';
import { Shield, Mail } from 'lucide-react';

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
                    <p className="text-muted-foreground leading-relaxed mb-8">
                        A <span className="font-medium text-accent">Xplore Viagens</span> respeita a sua privacidade
                        e está comprometida com a proteção dos dados pessoais de seus usuários, em conformidade com a
                        Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).
                    </p>

                    {/* Sections */}
                    <div className="space-y-8 text-sm leading-relaxed">
                        {/* 1 */}
                        <section>
                            <h2 className="font-semibold text-accent mb-2">1. Coleta de Informações</h2>
                            <p className="text-muted-foreground mb-3">
                                Ao utilizar o Login via Facebook ou Google em nosso portal, podemos coletar as seguintes
                                informações, mediante sua autorização:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                                <li>Nome completo</li>
                                <li>Foto do perfil</li>
                                <li>Endereço de e-mail</li>
                            </ul>
                            <p className="text-muted-foreground mt-3">
                                Esses dados são fornecidos pelas plataformas de autenticação e utilizados exclusivamente
                                para identificação e personalização da experiência do usuário.
                            </p>
                        </section>

                        {/* 2 */}
                        <section>
                            <h2 className="font-semibold text-accent mb-2">2. Finalidade do Uso dos Dados</h2>
                            <p className="text-muted-foreground mb-3">As informações coletadas são utilizadas para:</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                                <li>Criar e gerenciar sua conta em nosso sistema</li>
                                <li>Identificar avaliações e interações realizadas por você</li>
                                <li>Enviar confirmações de reservas e comunicações relacionadas aos serviços contratados</li>
                                <li>Melhorar a experiência do usuário na plataforma</li>
                            </ul>
                        </section>

                        {/* 3 */}
                        <section>
                            <h2 className="font-semibold text-accent mb-2">3. Compartilhamento de Dados</h2>
                            <p className="text-muted-foreground">
                                A Xplore Viagens não vende, aluga ou compartilha seus dados pessoais com terceiros,
                                exceto quando necessário para cumprimento de obrigação legal.
                            </p>
                        </section>

                        {/* 4 */}
                        <section>
                            <h2 className="font-semibold text-accent mb-2">4. Armazenamento e Segurança</h2>
                            <p className="text-muted-foreground">
                                Os dados são armazenados em ambiente seguro, com medidas técnicas e administrativas
                                adequadas para proteger contra acesso não autorizado, perda ou alteração indevida.
                            </p>
                        </section>

                        {/* 5 */}
                        <section>
                            <h2 className="font-semibold text-accent mb-2">5. Retenção de Dados</h2>
                            <p className="text-muted-foreground">
                                Os dados pessoais são mantidos enquanto sua conta estiver ativa ou pelo tempo necessário
                                para cumprimento de obrigações legais.
                            </p>
                        </section>

                        {/* 6 */}
                        <section>
                            <h2 className="font-semibold text-accent mb-2">6. Direitos do Titular</h2>
                            <p className="text-muted-foreground mb-3">Nos termos da LGPD, você pode solicitar:</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                                <li>Confirmação da existência de tratamento</li>
                                <li>Acesso aos dados</li>
                                <li>Correção de dados incompletos ou desatualizados</li>
                                <li>Exclusão dos dados pessoais</li>
                            </ul>
                        </section>

                        {/* 7 */}
                        <section>
                            <h2 className="font-semibold text-accent mb-2">7. Exclusão de Dados</h2>
                            <p className="text-muted-foreground mb-3">
                                Você pode solicitar a exclusão da sua conta e de seus dados pessoais a qualquer momento
                                enviando um e-mail para:
                            </p>
                            <a
                                href="mailto:voe@xploreviagens.com.br?subject=Exclus%C3%A3o%20de%20Dados"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                                <Mail className="w-4 h-4" />
                                voe@xploreviagens.com.br
                            </a>
                            <p className="text-muted-foreground mt-3">
                                Após a solicitação, seus dados serão excluídos no prazo legal aplicável.
                            </p>
                        </section>

                        {/* 8 */}
                        <section>
                            <h2 className="font-semibold text-accent mb-2">8. Alterações nesta Política</h2>
                            <p className="text-muted-foreground">
                                Esta Política de Privacidade poderá ser atualizada periodicamente. Recomendamos a
                                revisão regular deste documento.
                            </p>
                        </section>
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
