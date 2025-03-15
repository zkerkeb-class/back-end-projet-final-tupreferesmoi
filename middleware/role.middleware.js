const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

const User = require("../models/user.model");

const ArtistAuthorizedRoles = { // Role autorisé pour les opérations sur les artistes
    getArtists : ["admin" , "content-admin", "catalog-manager", "moderator"],
    createArtist : ["admin", "content-admin"],
    editArtist : ["admin", "content-admin", "catalog-manager"],
    deleteArtist : ["admin", "content-admin", "moderator"]
}

const AlbumsAuthorizedRoles = { // Role autorisé pour les opérations sur les albums
    getAlbums : ["admin" , "content-admin", "catalog-manager", "moderator"],
    createAlbum : ["admin", "content-admin"],
    editAlbum : ["admin", "content-admin", "catalog-manager"],
    deleteAlbum : ["admin", "content-admin", "moderator"]
}

const TracksAuthorizedRoles = { // Role autorisé pour les opérations sur les pistes
    getTracks: ["admin" , "content-admin", "moderator"],
    createTrack : ["admin", "content-admin"],
    editTrack : ["admin", "content-admin"],
    deleteTrack : ["admin", "content-admin", "moderator"]
}

const UserAuthorizedRoles = { // Role autorisé pour les opérations sur les utilisateurs
    getUsers : ["admin", "moderator"],
    editUser : ["admin" ],
    deleteUser : ["admin"]
}

const getUserRole = async (userId) =>{
    const user = await User.findById(req.params.userId);

    return user.role;
}
const role = async (req, res, next) => {

    try {

        
        let unauthorizedMessage;
        let userRole = userRole;
        // Récupérer le token du header Authorization
        let scope = req.headers.scope; //partie de l'application ciblé par l'action // Artist / ALbumes / Tracks... 
        let method = req.headers.method

        if(scope == "Artists"){

            if(method == "GET" ){
                if(ArtistAuthorizedRoles.getArtists.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${ArtistAuthorizedRoles.getArtists.join('; ')} sont autorisé éffectuer cet opération.`
                }
            }
            
            if(method == "POST" ){
                if(ArtistAuthorizedRoles.createArtist.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${ArtistAuthorizedRoles.createArtist.join('; ')} sont autorisé éffectuer cet opération.`
                }
            }
            
            if(method == "PUT" ){
                if(ArtistAuthorizedRoles.editArtist.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${ArtistAuthorizedRoles.editArtist.join('; ')} sont autorisé éffectuer cet opération.`
                }
            }
            
            if(method == "DELETE" ){
                if(ArtistAuthorizedRoles.deleteArtist.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${ArtistAuthorizedRoles.deleteArtist.join('; ')} sont autorisé éffectuer cet opération.`
                }
            }
            

        }

        if(scope == "Albums"){

            if(method == "GET" ){
                if(AlbumsAuthorizedRoles.getAlbums.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${AlbumsAuthorizedRoles.getAlbums.join('; ')} sont autorisé éffectué cet opération.`
                }
            }
            
            if(method == "POST" ){
                if(ArtistAuthorizedRoles.createAlbum.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${AlbumsAuthorizedRoles.createAlbum.join('; ')} sont autorisé éffectué cet opération.`
                }
            }
            
            if(method == "PUT" ){
                if(AlbumsAuthorizedRoles.editAlbum.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${AlbumsAuthorizedRoles.editAlbum.join('; ')} sont autorisé éffectué cet opération.`
                }
            }
            
            if(method == "DELETE" ){
                if(AlbumsAuthorizedRoles.deleteAlbum.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${AlbumsAuthorizedRoles.deleteAlbum.join('; ')} sont autorisé éffectué cet opération.`
                }
            }
        }

        if(scope == "Tracks"){

            if(method == "GET" ){
                if(TracksAuthorizedRoles.getTracks.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${TracksAuthorizedRoles.getTracks.join('; ')} sont autorisé éffectuer cet opération.`
                }
            }
            
            if(method == "POST" ){
                if(ArtistAuthorizedRoles.createTrack.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${TracksAuthorizedRoles.createTrack.join('; ')} sont autorisé éffectuer cet opération.`
                }
            }
            
            if(method == "PUT" ){
                if(TracksAuthorizedRoles.editAlbum.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${TracksAuthorizedRoles.editAlbum.join('; ')} sont autorisé éffectuer cet opération.`
                }
            }
            
            if(method == "DELETE" ){
                if(TracksAuthorizedRoles.deleteTrack.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${TracksAuthorizedRoles.deleteTrack.join('; ')} sont autorisé éffectuer cet opération.`
                }
            }
        }

        if(scope == "Users"){

            if(method == "GET" ){
                if(UserAuthorizedRoles.getUsers.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${UserAuthorizedRoles.getUsers.join('; ')} sont autorisé éffectuer cet opération.`
                }
            }        
            
            if(method == "PUT" ){
                if(UserAuthorizedRoles.editUser.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${UserAuthorizedRoles.editUser.join('; ')} sont autorisé éffectuer cet opération.`
                }
            }
            
            if(method == "DELETE" ){
                if(UserAuthorizedRoles.deleteUser.includes(userRole)) {
                    next();
                }else{
                    unauthorizedMessage = `Seuls les rôles ${UserAuthorizedRoles.deleteUser.join('; ')} sont autorisé éffectuer cet opération.`
                }
            }
        }

        if (unauthorizedMessage !== undefined) {
            return res.status(401).json({
                success: false,
                message: unauthorizedMessage,
            });
        }

      
    } catch (error) {
        logger.error("Erreur :", error);
        return res.status(500).json({
            success: false,
            message:`BAAD REQUEST : ${error}`,
        });
    }
};

module.exports = role;
