create table playlists (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER, payload text,
    FOREIGN KEY (owner_id)
    REFERENCES users (id) 
    ON UPDATE SET NULL
    ON DELETE SET NULL)

insert into playlists(owner_id, payload) values (1, "{name: 'edoardo'}");
insert into playlists(owner_id, payload) values (1, "{}");
