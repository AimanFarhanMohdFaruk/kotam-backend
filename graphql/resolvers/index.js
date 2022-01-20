
import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'
import  jwt  from 'jsonwebtoken'
import { dateScalar } from '../schema/index.js'
import { ObjectID } from 'bson'

 
const resolvers  = {
    
    User: {
        id: ({_id}) => _id || id //return _id 
    },

    Date: dateScalar,


    Query:{
        users: async (_,__, {db}) => {
            const users = await db.collection('Users').find().toArray()
            console.log(users)
            if(!users) {throw new Error("Error in retrieving users")}

            return users;
        },


        matchPosts: async (_,__,{db}) => {

            const matches = await db.collection("MatchPosts").find().toArray()

            if(!matches) {throw new Error("Error retrieving match listings")}

            return matches;
        },

        user: async(_,id,{db}) => {
            const user = await db.collection("Users").findOne({_id: id})
            console.log(user)
            if(!user) {throw new Error("Error retrieving user.")}

            return {
                user: user
            }
        }
    },

    Mutation:{
        signUp: async (_, data, {db}) => {
            const hashedPassword = bcrypt.hashSync(data.password, 10)
            const user = {...data, password: hashedPassword}
            
            //check email
            const existingUser = await db.collection("Users").findOne({email: user.email})

            if(existingUser) {throw new Error("A user with that email already exists. Please sign in")}

            const nameTaken = await db.collection("Users").findOne({name: user.name})

            if(nameTaken) {throw new Error("Username taken, please try a different username.")}

            //save to database
            const result = await db.collection('Users').insertOne(user)

            const newUser = await db.collection('Users').findOne({_id: ObjectId(result.insertedId)})
            
            const token = jwt.sign({email: newUser.email, id: newUser._id}, process.env.TOKEN_KEY, {expiresIn:"1h"})

            if (newUser) {
                return {
                    user: newUser,
                    token: token
                } 
            } else {
                console.log({message:"Error creating user"})
            }
         
        },

        signIn: async (_,data,{db}) => {

            //find user with the same email, check if the hashedPassword is the same, then return the user and the token

            const existingUser = await db.collection('Users').findOne({email: data.email})

            if(!existingUser) return {
                message:"No user found with this email. Please sign up."
            }

            const isPasswordCorrect = await bcrypt.compare(data.password, existingUser.password)

            if(!isPasswordCorrect) return {
                message:"Incorrect password, please try again."
            }

            const token = jwt.sign({email: existingUser.email, id: existingUser._id}, process.env.TOKEN_KEY, {expiresIn:"1h"})

            return {
                user: existingUser,
                token: token
            }
        },

        createMatchPost: async (_,data,{db, user}) => {

            // configure the dates
            // insert players - player 1 and player 2. player 1 is the User that is currently signed In (getUserFromToken)
            // How to get player 2? -- either through their username or email? how do we pass the data

            //current blockers
                // how to handle relations between different collections? done for players
                // group
                    // it needs to retrieve the group by fetching the group from the User collection
            
            console.log(data)

            if(!user) {throw new Error("Please sign in to submit a match result")}

            const opponent = await db.collection("Users").findOne({name: data.players[0]})
            console.log(opponent)

            //decide winner, if total score of P1 > P2 ? P1 wins : P2 wins
            const userScore = data.firstSetScore[0] + data.secondSetScore[0]
            const opponentScore = data.firstSetScore[1] + data.secondSetScore[1]

            const userWin = userScore > opponentScore
            
            let winner = userWin ? user : opponent

            const post = {...data, players:[user,opponent], winner: winner}

            console.log(post)

            const insertPost = await db.collection('MatchPosts').insertOne(post)

            const newPost = await db.collection('MatchPosts').findOne({_id: ObjectId(insertPost.insertedId)})

            console.log(newPost)

            if(!newPost) {throw new Error("Failed to create post")}

            return newPost
        },


        createGroup: async (_,data,{db}) => {

            const group = data
            console.log(group)

            const newGroup = await db.collection("Group").insertOne(group)

            const returnNewGroup = await db.collection("Group").findOne({_id: ObjectID(newGroup.insertedId)})

            if(!returnNewGroup) {throw new Error("Failed to create group")}

            return returnNewGroup;
        },
        
    },

}

export default resolvers;