import { User } from "../Domain/User";

const AuthUser = async (query: any, users: Array<User>) => {
    if (query.key && query.secret) {
        const user = users.find(user => user.key === query.key && user.secret === query.secret && user.active);
        if (user) {
            return user;
        }
    }
    return null;
};

export default AuthUser;