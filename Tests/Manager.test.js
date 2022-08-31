import ObjectsManager from "../Class/ObjectsManager.js";
import ManageableObject from "../Class/ManageableObject.js";
import { test, expect } from "vitest";
import User from "../Class/User.js";

const { user1, user2, user3, user4, adminUser, data } = {
	user1: new User(1, {}, "123456789", { username: "Testuser1name" }),
	user2: new User(2, {}, "123456789", { username: "Testuser2name" }),
	user3: new User(3, {}, "123456789", { username: "Testuser3name" }),
	user4: new User(4, {}, "123456789", { username: "Testuser4name" }),
	adminUser: new User(99, {}, "987654321", { username: "TestAdminUsername" }),
	data: { test: "testData", test2: "test2Data" },
};
const numberOfObject = 1000; // min 2; max 1000000

const manager = new ObjectsManager([adminUser.getId()]);

for (let i = 0; i < numberOfObject; i++)
	manager.create(i % 2 ? user1 : user2, data, false, false);

const object = manager.get(Math.floor(numberOfObject / 2));
const goodUser = object.getOwner();
const wrongUser = object.getOwner().getId() == 2 ? user1 : user2;

test("ManageableObject : Basic data", async () => {
	expect(object.getOwner()).toBe(goodUser);
	expect(object.test).toBe(data.test);
	expect(object.test2).toBe(data.test2);
	expect(object.getId()).toBeTypeOf("number");
	expect(object.getOwner()).toBeInstanceOf(User);
	expect(object.getToken()).toBeTypeOf("string");
	expect(object.getVisibility()).toBeTypeOf("boolean");
	expect(object.createdAt).toBeTypeOf("number");
	expect(object.updatedAt).toBeTypeOf("number");
	expect(object.createdAt).toBeLessThan(Date.now());
});

test("ManageableObject : system entries", async () => {
	object.setVisibility(true);
	expect(manager.checkUserAccess(object.getId(), wrongUser, "wrongToken")).toBe(object);
	object.setVisibility(false);

	expect(() =>
		manager.checkUserAccess(object.getId(), wrongUser, "wrongToken")
	).toThrowError(`User ${wrongUser.username} don't have access`);

	object.setToken("wrongToken");
	expect(manager.checkUserAccess(object.getId(), wrongUser, "wrongToken")).toBe(object);
	object.setToken("newToken");
	expect(() =>
		manager.checkUserAccess(object.getId(), wrongUser, "wrongToken")
	).toThrowError(`User ${wrongUser.username} don't have access`);

	object.setOwner(wrongUser);
	expect(manager.checkUserAccess(object.getId(), wrongUser, "wrongToken")).toBe(object);
	object.setOwner(goodUser);
	expect(() =>
		manager.checkUserAccess(object.getId(), wrongUser, "wrongToken")
	).toThrowError(`User ${wrongUser.username} don't have access`);

	object.addUser(user4);
	expect(
		() => manager.getActions(object.getId(), wrongUser, 7864363).length
	).toThrowError(`User ${wrongUser.username} don't have access`);
	expect(manager.getActions(object.getId(), user4, 7864363).length).toBe(2);
	expect(manager.getActions(object.getId(), wrongUser, object.getToken()).length).toBe(4);
	object.deleteUser(user4);
});

test("ManageableObject : gestion utilisateurs", async () => {
	expect(object.getUsers()).toBeInstanceOf(Array);
	expect(object.getUsers().length).toBe(0);

	manager.makeAction("addUser", [user3], object.getId(), goodUser);
	expect(object.getUsers().length).toBe(1);
	manager.makeAction("addUser", [user3], object.getId(), goodUser);
	manager.makeAction("addUser", [user3], object.getId(), goodUser);
	expect(object.getUsers().length).toBe(1);
	expect(object.userIsPresent(user1)).toBeFalsy();
	expect(object.userIsPresent(user3)).toBeTruthy();

	object.addUsers([user1, user2]);
	expect(object.getUsers().length).toBe(3);
	object.addUsers([user1, user2]);
	expect(object.getUsers().length).toBe(3);
	expect(object.userIsPresent(user4)).toBeFalsy();
	expect(object.userIsPresent(user3)).toBeTruthy();

	object.deleteUser(user2);
	expect(object.getUsers().length).toBe(2);
	expect(object.userIsPresent(user2)).toBeFalsy();
	expect(object.userIsPresent(user3)).toBeTruthy();

	object.deleteUsers([user1, user3]);
	expect(object.getUsers().length).toBe(0);
	expect(object.userIsPresent(user3)).toBeFalsy();
});

test("Manager : Experiment the data creation, get, find and findAll", async () => {
	expect(() => manager.create(user1, { ...data, getOwner: "WrongOwner" })).toThrowError(
		`"getOwner" already exist in ManageableObject`
	);

	const objectNull = manager.get(numberOfObject * 2, user1);
	expect(objectNull).toBeFalsy();

	const objectFind = await manager.find(
		(obj) => obj.getId() == object.getId(),
		object.getOwner(),
		null
	);
	expect(objectFind).toBe(object);

	const objectFindAll = await manager.findAll(
		(obj) => {
			return obj.getOwner().getId() == goodUser.getId();
		},
		object.getOwner(),
		null
	);
	expect(objectFindAll[0].getOwner()).toBe(goodUser);
	expect(objectFindAll.length).toBeLessThan(numberOfObject);

	const objectFindAllWithToken = await manager.findAll(
		undefined,
		null,
		object.getToken()
	);
	expect(objectFindAllWithToken[0].getOwner()).toBe(object.getOwner());
	expect(objectFindAllWithToken.length).toBe(1);

	const objectFindAllWithOwner = await manager.findAll(undefined, object.getOwner());
	expect(objectFindAllWithOwner[0].getOwner()).toBe(object.getOwner());
	expect(objectFindAllWithOwner.length).toBeLessThan(numberOfObject);
});

test("Manager : Check the data access", async () => {
	expect(manager.checkUserAccess(object.getId(), wrongUser, object.getToken())).toBe(
		object
	);
	expect(manager.checkUserAccess(object.getId(), adminUser, "wrongToken")).toBe(object);
	expect(() =>
		manager.checkUserAccess(object.getId(), wrongUser, "wrongToken")
	).toThrowError(`User ${wrongUser.username} don't have access`);
});

test("Manager : getInfo", async () => {
	object.addUser(user3);
	expect(() => manager.getInfo(object.getId(), wrongUser, "wrongToken")).toThrowError(
		`User ${wrongUser.username} don't have access`
	);

	const infoFromOwner = JSON.parse(manager.getInfo(object.getId(), goodUser));
	expect(infoFromOwner.getToken).toBe(object.getToken());
	expect(infoFromOwner.test).toBe(object.test);
	expect(infoFromOwner.test2).toBe(object.test2);

	const infoFromUser = JSON.parse(manager.getInfo(object.getId(), user3));
	expect(infoFromUser.getToken).toBe();
	expect(infoFromUser.test).toBe();
	expect(infoFromUser.createdAt).toBe(object.createdAt);
	expect(infoFromUser.getUsers[0].id).toBe(user3.getId());

	object.setVisibility(true);
	const infoFromPublic = JSON.parse(manager.getInfo(object.getId(), wrongUser));

	expect(infoFromPublic.getId).toBe(object.getId());
	expect(infoFromPublic.getOwner.id).toBe(object.getOwner().getId());
	expect(infoFromPublic.getVisibility).toBe(object.getVisibility());
	expect(infoFromPublic.getUsers[0].id).toBe("XXXX");
	expect(infoFromPublic.createdAt).toBe();
	expect(infoFromPublic.test).toBe();

	object.setVisibility(false);
	object.deleteUser(user3);
});
