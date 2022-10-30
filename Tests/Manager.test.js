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

const manager = new ObjectsManager(true, [adminUser.getId()]);

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
	expect(object.getCreatedAt()).toBeTypeOf("number");
	expect(object.getUpdatedAt()).toBeTypeOf("number");
	expect(object.getCreatedAt()).toBeLessThan(Date.now());
	expect(object.getManager()).toBeTypeOf("object");
});

test("ManageableObject : system entries", async () => {
	object.setVisibility(true);
	expect(manager.checkUserAccess(object.getId(), wrongUser, "wrongToken")).toBe(object);
	object.setVisibility(false);

	expect(() =>
		manager.checkUserAccess(object.getId(), wrongUser, "wrongToken")
	).toThrowError(`User ${wrongUser.getId()} don't have access`);

	object.setToken("wrongToken");
	expect(manager.checkUserAccess(object.getId(), wrongUser, "wrongToken")).toBe(object);
	object.setToken("newToken");
	expect(() =>
		manager.checkUserAccess(object.getId(), wrongUser, "wrongToken")
	).toThrowError(`User ${wrongUser.getId()} don't have access`);

	object.setOwner(wrongUser);
	expect(manager.checkUserAccess(object.getId(), wrongUser, "wrongToken")).toBe(object);
	object.setOwner(goodUser);
	expect(() =>
		manager.checkUserAccess(object.getId(), wrongUser, "wrongToken")
	).toThrowError(`User ${wrongUser.getId()} don't have access`);

	object.addUser(user4);
	expect(
		() => manager.getPermissions(object.getId(), wrongUser, 7864363).length
	).toThrowError(`User ${wrongUser.getId()} don't have access`);
	expect(manager.getPermissions(object.getId(), user4, 7864363).length).toBe(2);
	expect(manager.getPermissions(object.getId(), wrongUser, object.getToken()).length).toBe(6);
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
	).toThrowError(`User ${wrongUser.getId()} don't have access`);
});

test("Manager : getInfo", async () => {
	object.addUser(user3);
	expect(manager.getInfo(object.getId(), wrongUser, "wrongToken")).toBe(undefined);

	const infoFromOwner = manager.getInfo(object.getId(), goodUser);
	expect(infoFromOwner.token).toBe(object.getToken());
	expect(infoFromOwner.data.test).toBe(object.test);
	expect(infoFromOwner.data.test2).toBe(object.test2);

	const infoFromUser = manager.getInfo(object.getId(), user3);
	expect(infoFromUser.token).toBe();
	expect(infoFromUser.test).toBe();
	expect(infoFromUser.createdAt).toBe(object.getCreatedAt());
	expect(infoFromUser.users[0].id).toBe(user3.getId());

	object.setVisibility(true);
	const infoFromPublic = manager.getInfo(object.getId(), wrongUser);

	expect(infoFromPublic.id).toBe(object.getId());
	expect(infoFromPublic.owner.id).toBe(object.getOwner().getId());
	expect(infoFromPublic.visibility).toBe(object.getVisibility());
	expect(infoFromPublic.users[0].id).toBe(user3.getId());
	expect(infoFromPublic.createdAt).toBe(object.getCreatedAt());
	expect(infoFromPublic.updatedAt).toBe();
	expect(infoFromPublic.data.test).toBe();

	object.setVisibility(false);
	object.deleteUser(user3);
});

test("Manager : getInfos", async () => {
	const infoFromOwner = manager.getInfos(adminUser);
	expect(infoFromOwner.length).toBe(numberOfObject);
});
