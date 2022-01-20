import {gql} from 'apollo-server'
import { GraphQLScalarType, Kind } from 'graphql'



const typeDefs = gql`

    scalar Date
    
    type User {
        id: ID!
        name: String!
        email: String!
        password: String!
        group: Group
        matchHistory: [MatchPost]
    }

    type Group{
        id:ID!
        groupName:String
    }

    type MatchPost {
        id: ID!
        group: [Group]
        location: String!
        datePlayed: Date!
        players: [User]
        firstSetScore: [Int]
        secondSetScore: [Int]
        winner: User
    }

    type Query {
        users: [User]
        user(id: ID!): User
        matchPosts: [MatchPost]
        me: User
        group: [Group]
    }

    type Mutation {
        createMatchPost(     
            group: [String]
            location: String!,
            datePlayed: Date!,
            players: [String]!,
            firstSetScore: [Int]!,
            secondSetScore: [Int]!,
            winner: String
            ) : MatchPost
    }

    type Mutation {
        signUp(
        name: String!,
        email: String!,
        password: String!
        group: String
        ) : AuthUser!
    }

    type Mutation {
        signIn(
            email: String!,
            password: String!
        ) : AuthUser!
    }

    type Mutation {
        createGroup(
            groupName: String!
        ) : Group
    }

    type AuthUser {
        user: User!
        token: String
    }

`;

export const dateScalar = new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    serialize(value) {
    return value.getTime(); // Convert outgoing Date to integer for JSON
    },
    parseValue(value) {
    return new Date(value); // Convert incoming integer to Date
    },
    parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
        return new Date(parseInt(ast.value, 10)); // Convert hard-coded AST string to integer and then to Date
    }
    return null; // Invalid hard-coded value (not an integer)
    },
});

export default typeDefs;