const app = require('../middleware/modules/server')
const supertest = require('supertest')
const request = supertest(app)
const expect = require("chai").expect;

describe("test methods", function () {
    it("testing", async function () {
        const response = await request.get("/test");
        expect(response.body.message).to.eql('pass!');

    });
});


