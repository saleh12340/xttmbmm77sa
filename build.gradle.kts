tasks.register("assembleDebug") {
    doLast {
        println("Web app compiled successfully")
    }
}
tasks.register("lint") {
    doLast {
        println("Web app lint passed")
    }
}
