import AdminCrudScreen from "./AdminCrudScreen";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "AdminCrud">;

export default function UsersScreen(props: Props) {
  return (
    <AdminCrudScreen
      {...props}
      route={{
        ...props.route,
        key: props.route.key,
        name: "AdminCrud",
        params: { entity: "users" },
      }}
    />
  );
}
