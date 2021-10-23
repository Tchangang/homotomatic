import { User } from "../Domain/User";

const AuthUser = async (query: any, users: Array<User>) => {
    console.log('query', query);
    if (query.key && query.secret) {
        const user = users.find(user => user.key === query.key && user.secret === query.secret && user.active);
        console.log('user', user);
        if (user) {
            return user;
        }
    }
    return null;
};

export default AuthUser;