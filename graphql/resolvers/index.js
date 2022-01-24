
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

            if(!users) {throw new Error("Error in retrieving users")}

            return users;
        },


        matchPosts: async (_,__,{db}) => {

            const matches = await db.collection("MatchPosts").find().toArray()

            if(!matches) {throw new Error("Error retrieving match listings")}

            return matches;
        },

        user: async(_,data,{db}) => {
            console.log(data)

            const user = await db.collection("Users").findOne({_id: data.id}).toArray()

            if(!user) {throw new Error("Error retrieving user.")}

            return {
                user: user
            }
        }
    },

    Mutation:{
        signUp: async (_, data, {db}) => {

            const hashedPassword = bcrypt.hashSync(data.password, 10)
            const group = await db.collection("Group").findOne({groupName: data.group}) //retrive group name from the form

            const user = {...data, password: hashedPassword, group: group}
            
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

            if(!user) {throw new Error("Please sign in to submit a match result")}           

            //get opponent user
            const opponent = await db.collection("Users").findOne({name: data.players[0]})

            const userScore = data.firstSetScore[0] + data.secondSetScore[0]
            const opponentScore = data.firstSetScore[1] + data.secondSetScore[1]

            const userWin = userScore > opponentScore
            
            let winner = userWin ? user : opponent

            const post = {...data, players:[user,opponent], winner: winner, group: [user.group, opponent.group]}

            const insertPost = await db.collection('MatchPosts').insertOne(post)

            const newPost = await db.collection('MatchPosts').findOne({_id: ObjectId(insertPost.insertedId)})

            if(!newPost) {throw new Error("Failed to create post")}

            return newPost
        },


        createGroup: async (_,data,{db}) => {

            const newGroup = await db.collection("Group").insertOne(data)

            const returnNewGroup = await db.collection("Group").findOne({_id: ObjectID(newGroup.insertedId)})

            if(!returnNewGroup) {throw new Error("Failed to create group")}

            return returnNewGroup;
        },
        
    },

}

export default resolvers;