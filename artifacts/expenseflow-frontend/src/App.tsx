import { useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./components/SplashScreen";
import Walkthrough from "./components/Walkthrough";
import PrivacyPolicy from "./pages/PrivacyPolicy";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const [stage, setStage] = useState<"splash" | "walkthrough" | "app">("splash");

  if (location === "/privacy-policy") {
    return <PrivacyPolicy />;
  }

  const handleSplashFinish = () => {
    const seen = localStorage.getItem("ef_onboarded");
    setStage(seen ? "app" : "walkthrough");
  };

  const handleWalkthroughFinish = () => {
    localStorage.setItem("ef_onboarded", "1");
    setStage("app");
  };

  if (stage === "splash") {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (stage === "walkthrough") {
    return <Walkthrough onFinish={handleWalkthroughFinish} />;
  }

  return <Router />;
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AppContent />
    </WouterRouter>
  );
}

export default App;
