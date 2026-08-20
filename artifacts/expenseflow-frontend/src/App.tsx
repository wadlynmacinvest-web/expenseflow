import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./components/SplashScreen";
import Walkthrough from "./components/Walkthrough";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  const [stage, setStage] = useState<"splash" | "walkthrough" | "app">("splash");

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

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
