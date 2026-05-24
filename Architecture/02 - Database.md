# Circlo - Relational Database Design

## Database Choice

Circlo uses:

- Azure Database for PostgreSQL

PostgreSQL is used because the system has clear relational data:
- Users create listings and posts
- Listings have images and interactions
- Users join conversations and send messages

---

## Core Tables

### Users
Stores verified student accounts.

Fields:
- `id` - Primary key
- `clerk_user_id` - Unique Clerk user identifier
- `email` - Unique UIC email
- `first_name`
- `last_name`
- `profile_image_url`
- `created_at`
- `updated_at`

---

### Listings
Stores marketplace listings.

Fields:
- `id` - Primary key
- `seller_id` - Foreign key to `Users.id`
- `title`
- `description`
- `price`
- `category`
- `status`
- `created_at`
- `updated_at`

Example categories:
- `item`
- `service`
- `ticket`
- `gig`
- `rental`

Example statuses:
- `active`
- `sold`
- `removed`

---

### ListingImages
Stores image URLs for listings.

Fields:
- `id` - Primary key
- `listing_id` - Foreign key to `Listings.id`
- `image_url`
- `display_order`
- `created_at`

Relationship:
- One listing can have many images

---

### Posts
Stores community feed posts.

Fields:
- `id` - Primary key
- `author_id` - Foreign key to `Users.id`
- `content`
- `type`
- `created_at`
- `updated_at`

Post types:
- `looking_for`
- `offering`
- `question`

---

### Interactions
Stores like / skip actions from swipe discovery.

Fields:
- `id` - Primary key
- `user_id` - Foreign key to `Users.id`
- `listing_id` - Foreign key to `Listings.id`
- `interaction_type`
- `created_at`

Interaction types:
- `like`
- `skip`

Recommended constraint:
- `UNIQUE(user_id, listing_id)`

This prevents duplicate interaction records for the same user and listing.

---

### Conversations
Stores chat conversations.

Fields:
- `id` - Primary key
- `created_at`
- `updated_at`

---

### ConversationMembers
Join table between users and conversations.

Fields:
- `id` - Primary key
- `conversation_id` - Foreign key to `Conversations.id`
- `user_id` - Foreign key to `Users.id`
- `joined_at`

Recommended constraint:
- `UNIQUE(conversation_id, user_id)`

This prevents the same user from being inserted twice into the same conversation.

---

### Messages
Stores chat messages.

Fields:
- `id` - Primary key
- `conversation_id` - Foreign key to `Conversations.id`
- `sender_id` - Foreign key to `Users.id`
- `content`
- `created_at`

---

## Main Relationships

- One user can create many listings
- One user can create many posts
- One user can perform many interactions
- One listing can have many images
- One listing can receive many interactions
- Users and conversations have a many-to-many relationship through `ConversationMembers`
- One conversation can have many messages
- One user can send many messages

---

## ERD Diagram

See:
- `Circlo - Relational Database Design`