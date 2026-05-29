import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Nav } from "@/components/nav";
import { DashboardPage } from "@/pages/DashboardPage";
import { GamesPage } from "@/pages/GamesPage";
import { DecklistPage } from "@/pages/DecklistPage";
import { PrizesPage } from "@/pages/PrizesPage";
import { IterationsPage } from "@/pages/IterationsPage";
import { TournamentsPage } from "@/pages/TournamentsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000 } },
});

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/games" component={GamesPage} />
      <Route path="/decklist" component={DecklistPage} />
      <Route path="/prizes" component={PrizesPage} />
      <Route path="/iterations" component={IterationsPage} />
      <Route path="/tournaments" component={TournamentsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div className="flex min-h-screen flex-col sm:flex-row">
          <Nav />
          <main className="flex-1 p-4 sm:p-8">
            <AppRouter />
          </main>
        </div>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
