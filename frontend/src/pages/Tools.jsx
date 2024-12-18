import { useAuth } from "../state/auth";

export const Tools = () => {
  useAuth();
  return (
    <div>
      <h1>Tool Search</h1>
    </div>
  );
};
