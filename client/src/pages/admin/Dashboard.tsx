import { useEffect } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plane, Star, Image, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
    const [, navigate] = useLocation();

    // @ts-expect-error - tRPC types are generated when server is running
    const propertiesQuery = trpc.properties.listAll.useQuery();
    // @ts-expect-error - tRPC types are generated when server is running
    const travelsQuery = trpc.viagens.list.useQuery();
    // @ts-expect-error - tRPC types are generated when server is running
    const reviewsQuery = trpc.reviews.list.useQuery();
    // @ts-expect-error - tRPC types are generated when server is running
    const slidesQuery = trpc.heroSlides.list.useQuery();

    const reviews: any[] = (reviewsQuery.data as any)?.json || reviewsQuery.data || [];
    const pendingReviewsCount = reviews.filter((r: any) => r.status === "pending").length;

    const stats = [
        {
            title: "Total Hospedagens",
            value: propertiesQuery.data?.length || 0,
            icon: Building2,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Viagens Ativas",
            value: travelsQuery.data?.length || 0,
            icon: Plane,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            title: "Avaliações Pendentes",
            value: pendingReviewsCount,
            icon: Star,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
        },
        {
            title: "Slides Hero",
            value: slidesQuery.data?.filter((s: any) => s.isActive === 1).length || 0,
            icon: Image,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Visão geral do sistema</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.title}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                                        <Icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stat.value}</div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {pendingReviewsCount > 0 && (
                    <Card className="border-amber-200 bg-amber-50">
                        <CardContent className="pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="bg-amber-100 text-amber-700 rounded-lg p-2">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-amber-900">
                                        Atenção: você tem {pendingReviewsCount} {pendingReviewsCount === 1 ? "avaliação pendente" : "avaliações pendentes"} para aprovar.
                                    </p>
                                    <p className="text-sm text-amber-800 mt-1">
                                        Revise as avaliações para manter os depoimentos da home atualizados.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => navigate("/admin/avaliacoes")}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                Ir para avaliações
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Bem-vindo ao Painel Administrativo</CardTitle>
                        <CardDescription>
                            Use o menu lateral para navegar pelas diferentes seções do sistema.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </AdminLayout>
    );
}
