const artistSchema = {
  name: String,
  bio: String,
  genres: [String],
  popularity: Number,
  image: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

const albumSchema = {
  title: String,
  artistId: { type: ObjectId, ref: 'Artist' },
  releaseDate: Date,
  genres: [String],
  coverImage: String,
  trackCount: Number,
  type: { type: String, enum: ['album', 'single', 'ep'] },
  label: String,
  copyright: String,
  featuring: [{ type: ObjectId, ref: 'Artist' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

const trackSchema = {
  title: String,
  albumId: { type: ObjectId, ref: 'Album' },
  duration: Number,
  fileUrl: String,
  lyrics: String,
  genres: [String],
  trackNumber: Number,
  popularity: Number,
  featuring: [{ type: ObjectId, ref: 'Artist' }],
  previewUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

const userSchema = {
  email: { type: String, unique: true },
  password: String,
  username: { type: String, unique: true },
  profileImage: String,
  country: String,
  language: String,
  accountType: { type: String, enum: ['free', 'premium'] },
  role: { type: String, enum: ['user', 'admin'] },
  privacySettings: {
    profileVisibility: { type: String, enum: ['public', 'private'] },
    playlistsVisibility: { type: String, enum: ['public', 'private'] }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

const playlistSchema = {
  name: String,
  userId: { type: ObjectId, ref: 'User' },
  trackIds: [{ type: ObjectId, ref: 'Track' }],
  isPublic: Boolean,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

const listenSchema = {
  userId: { type: ObjectId, ref: 'User' },
  trackId: { type: ObjectId, ref: 'Track' },
  timestamp: { type: Date, default: Date.now },
  device: String
};

const followerSchema = {
  followerId: { type: ObjectId, ref: 'User' },
  followedId: { type: ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
};

const likeSchema = {
  userId: { type: ObjectId, ref: 'User' },
  itemId: ObjectId,
  itemType: { type: String, enum: ['track', 'album', 'playlist'] },
  createdAt: { type: Date, default: Date.now }
};

const queueHistorySchema = {
  userId: { type: ObjectId, ref: 'User' },
  trackId: { type: ObjectId, ref: 'Track' },
  playedAt: { type: Date, default: Date.now }
};
