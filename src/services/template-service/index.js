module.exports = {
    extensions: [
        {
            key: 'template-customer-update',
            path: '/customer/update',

            triggers: {
                customer: {
                    Update: async ({ data, ct }) => {
                        return ct && (await ct.project.get())
                    }
                }
            }
        }
    ],
    microservices: [
        {
            key: 'template-microservice',
            path: '/microservice',
            method: 'post',

            handle: async ({ data, ct }) => {
                return ct && (await ct.project.get())
            }
        }
    ]
}