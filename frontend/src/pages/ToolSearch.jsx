import { useAuth } from "../state/auth";

export const ToolSearch = () => {
  useAuth();
  return (
    <div>
      <h1>Tool Search</h1>
    </div>
  );
};
